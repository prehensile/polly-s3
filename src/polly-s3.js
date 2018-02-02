var AWS = require('aws-sdk');
var hash = require('hash.js');
var xml2js = require('xml2js');


function parseOption( optionKey, defaultValue, options ){
  if( options && optionKey in options ) return optionKey;
  return defaultValue;
}

function PollyS3( options ){
    
    options = preprocessOptions( options );

    this._polly = new AWS.Polly( options );
    this._s3 = new AWS.S3( options );

    this._speechBucket = options.s3Bucket;
    this.defaultVoice = parseOption( "voice", "Brian", options );

    this._hashFilenames = true;
    if( 'humanReadableFilenames' in options ){
      this._hashFilenames != options[ 'humanReadableFilenames' ];
    }
}

/**
 * Preprocess an options object and fill out some defaults.
 */
function preprocessOptions( options ){
  if( !options ) options = {};

  // try to get region from standard AWS env if we don't have one
  if ( !('region' in options) )
    options.region = process.env.AWS_DEFAULT_REGION;

  // try to get S3 bucket from  env if we don't have one
  if ( !('s3Bucket' in options) )
    options.s3Bucket = process.env.AWS_S3_DEFAULT_BUCKET;
  
  return options;
}

/**
 *  Generate an S3 key for rendered speech.
 *
 *  Keys are unique to voice and sentence.
 *
 *  @param {String} sentence the sentence to render.
 *  @param {String} voice the voice to use for this sentence.
 *  @returns {String} a key to use to store the rendered speech in an S3 bucket.
 */
function keyForSentence( sentence, voice, useHash ){
    var s = voice + sentence;
    if( useHash ){
      // if _hashFilenames is set (the default), return a hash of the voice and text for the filename
      return hash.sha1().update(s).digest('hex');
    }
    // otherwise, return a shorter (but still human-readableish) filename by removing vowels
    return s.toLowerCase().replace(/[^bcdfghjklmnpqrstvwxyz]/g,'');
}


function bucketURLForKey( bucket, key ){
    // TODO: I am suspicious about generating URLs this way,
    // but according to AWS docs it should work, see:
    // https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html#access-bucket-intro
    return "https://" + bucket + ".s3.amazonaws.com/" + key;
}


function itPutsTheStreamInTheBucket( s3, bucket, stream, key, contentType, callback ){
    s3.upload(
        {
            Bucket : bucket,
            Key : key,
            Body : stream,
            ContentType : contentType
        },
        callback
    );
};


const volume = "+20dB";

function onRenderSentenceComplete( polly, s3, bucket, sentence, voice, filename, callback ){
    
    // wrap text in prosody element to boost volume to match alexa's voice
    // sentence = `<speak><prosody volume='${volume}'>${sentence}</prosody></speak>`;
    
    var textType = 'text';
    // TODO: maybe use a real XML parser for this?
    if( sentence.indexOf('<speak>') > -1 )
      textType = 'ssml';

    polly.synthesizeSpeech(
        {
            // TODO: expose OutputFormat as a function argument
            OutputFormat : "mp3",
            Text : sentence,
            VoiceId : voice,
            TextType: textType
        },
        function( err, data ){
            if( err ) callback( err );
            else {
                itPutsTheStreamInTheBucket(
                    s3,
                    bucket,
                    data.AudioStream,
                    filename,
                    data.ContentType,
                    callback
                );
            }
        }
    );
}


var pp = PollyS3.prototype;

/**
 *  Render some speech.
 *
 *  @param {String} sentence the sentence to render.
 *  @param {String} voice the voice to use for this sentence.
 */
pp.renderSentence = function( sentence, voice, callback ){
    
    if( !voice ) voice = this.defaultVoice;
    var filename = keyForSentence( sentence, voice, this._hashFilenames ) + ".mp3";
    var ref = this;
    var bucket = this._speechBucket;

    // before rendering, check if this sentence is already in S3
    this._s3.headObject( 
        {
            Bucket: bucket,
            Key: filename
        },
        function( err, data ) {
            if( err ){
                // error!
                if( err.code == 'NotFound' ){
                  // object doesn't exist, so render it 
                  // console.log( "Object does not exist in bucket [", bucket, "] for key [", filename, "], generating..." );
                  onRenderSentenceComplete(
                    ref._polly,
                    ref._s3,
                    bucket,
                    sentence,
                    voice,
                    filename,
                    function( err, data ){
                        if( err ) callback( err );
                        else callback( null, data.Location );
                    }
                  );
                } else {
                  // error isn't useful to us, so throw it
                  throw( err );
                }  
            } else {
                // console.log( "Object already exists in bucket [", bucket, "] for key [", filename, "]" );
                // no error. object exists, so let's callback immediately.
                // TODO: is there a better way to get the URL to the object?
                // see: 
                callback( null, bucketURLForKey( bucket, filename) );
            }
        }
    );
};

onDescribeVoicesComplete = function( polly, params, callback ){
  polly.describeVoices( params, function(err,data){
    if(err) callback(err);
    else {
      // TODO: pagination using NextToken field, if necessary
      callback( null, data.Voices );
    }
  });
};

pp.describeVoices = function( language, callback ){

    var params = {};
    if( language ){
        params[ "LanguageCode" ] = language;
    }

    if(language instanceof Array){
      // multiple languages specified, fetch them all
      var _p = this._polly;

      var fetch_language = function( voices, language_index ){
       if(language_index > -1){

          var this_language = language[language_index];

          params[ "LanguageCode" ] = this_language;
          onDescribeVoicesComplete( _p, params, function(err,data){
            if( err ) callback( err );
            else {
              // console.log( data );
              voices = voices.concat( data );
              fetch_language( voices, language_index-1 );
            }
          });

        } else {
          callback( null, voices );
        }
      };

      fetch_language( [], language.length-1 );

    } else {
      // one language specified, just do a nice simple call
      onDescribeVoicesComplete( this._polly, params, callback );
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
  
   
}; 

pp.randomVoice = function( language, callback ){
  this.describeVoices( language, function(err,data){
    if(err) callback(err);
    else {
      var voice = data[ Math.floor(Math.random()*data.length) ];
      callback( null, voice );
    }
  });
};

module.exports = PollyS3;