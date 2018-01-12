function PollyS3( speechBucket ){
    
    this.defaultVoice = "Brian";

    // var awsDefaults = {
    //     accessKeyId : secrets.AWSPolly.AccessKey,
    //     secretAccessKey : secrets.AWSPolly.Secret,
    //     region : "eu-west-1"
    // };

    this._polly = new AWS.Polly( awsDefaults );
    this._s3 = new AWS.S3( awsDefaults );

    this._speechBucket = speechBucket;

    // probably not right?
    this._urlBucketRoot = speechBucket;
}

var pp = PollyS3.prototype;


/**
 *  Generate an S3 key for rendered speech.
 *
 *  Keys are unique to voice and sentence.
 *
 *  @param {String} sentence the sentence to render.
 *  @param {String} voice the voice to use for this sentence.
 *  @returns {String} a key to use to store the rendered speech in an S3 bucket.
 */
function keyForSentence( sentence, voice ){
    var s = voice + sentence;
    return s.toLowerCase().replace(/[^bcdfghjklmnpqrstvwxyz]/g,'');
}


function bucketURLForKey( key ){
    return this._urlBucketRoot + key;
}


function itPutsTheStreamInTheBucket( s3, bucket, stream, key, contentType, callback ){

    s3.upload(
        {
            Bucket : bucket,
            Key : key,
            Body : stream,
            ContentType : contentType
        },
        function( err, data ) {
            if( err ) callback( err );
            else {
                callback( null );
            }
        }
    );
}


const volume = "+20dB";

function renderSentenceForRealsies( polly, s3, sentence, voice, filename, callback ){
    
    // wrap text in prosody element to boost volume to match alexa's voice
    sentence = `<speak><prosody volume='${volume}'>${sentence}</prosody></speak>`;
    
    polly.synthesizeSpeech(
        {
            OutputFormat : "mp3",
            Text : sentence,
            VoiceId : voice,
            TextType: "ssml"
        },
        function( err, data ){
            if( err ) callback( err );
            else {
                itPutsTheStreamInTheBucket(
                    s3,
                    data.AudioStream,
                    filename,
                    data.ContentType,
                    callback
                );
            }
        }
    );
}

/**
 *  Render some speech.
 *
 *  @param {String} sentence the sentence to render.
 *  @param {String} voice the voice to use for this sentence.
 */
pp.renderSentence = function( sentence, callback, voice ){
    
    var filename = keyForSentence( sentence, voice ) + ".mp3";
    var fileURL = bucketURLForKey( filename );

    if( !voice ) voice = this.defaultVoice;

    // before rendering, check if this sentence is already in S3
    this._s3.headObject( 
        {
            Bucket: this._speechBucket,
            Key: filename
        },
        function( err, data ) {
            
            if( err ){
                // error! object probably doesn't exist, so render it
                renderSentenceForRealsies(
                    this._polly,
                    this._s3,
                    sentence,
                    voice,
                    filename,
                    function(err){
                        if( err ) callback( err );
                        else callback( null, fileURL );
                    }
                );
            
            } else {
                // success! object exists, so let's callback immediately.
                callback( null, fileURL );
            }
        }
    );
};

pp.describeVoices = function( callback, language ){

    var params = {};
    if( language ){
        params[ "LanguageCode" ] = language;
    }

    /*
   data = {
    Voices: [
       {
      Gender: "Female", 
      Id: "Emma", 
      LanguageCode: "en-GB", 
      LanguageName: "British English", 
      Name: "Emma"
     }, 
       {
      Gender: "Male", 
      Id: "Brian", 
      LanguageCode: "en-GB", 
      LanguageName: "British English", 
      Name: "Brian"
     }, 
       {
      Gender: "Female", 
      Id: "Amy", 
      LanguageCode: "en-GB", 
      LanguageName: "British English", 
      Name: "Amy"
     }
    ]
   }
   */
    polly.describeVoices( params, callback );

}; 

module.exports = PollyS3;