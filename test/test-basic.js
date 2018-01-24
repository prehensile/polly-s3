var chai = require('chai');
chai.use(require('chai-json-schema'));
chai.use(require('chai-url'));

var expect = chai.expect;

var PollyS3 = require( "../src/polly-s3" );

/* 
[
    {Gender: 'Male',
    Id: 'Jacek',
    LanguageCode: 'pl-PL',
    LanguageName: 'Polish',
    Name: 'Jacek'},
    ...
]
*/

var schemaVoice = {
    'type' : 'object',
    properties: {
        'Gender' : 'string',
        'Id' : 'string',
        'LanguageCode' : 'string',
        'LanguageName' : 'string',
        'Name' : 'string'
    },
    required : [ 'Gender','Id','LanguageCode','LanguageName','Name' ]
};

var schemaVoiceList = {
    title : 'Voice list schema',
    type : 'array',
    minItems: 1,
    uniqueItems: true,
    items: {
        schemaVoice
    }
};

var english_langauges = [ "en-GB", "en-US", "en-AU", "en-IN", "en-GB-WLS" ];


describe('Basic tests', function() {
  
  it('should list ALL voices', function(done){
    
    var p = new PollyS3();
    
    p.describeVoices( null, function( err, data ){
        if( err ) throw( err );
        expect( data ).to.be.jsonSchema( schemaVoiceList );
        done();
    });
  });

  it('should list ALL english voices', function(done){
    
    var p = new PollyS3();
    
    p.describeVoices( english_langauges, function( err, data ){
        if( err ) throw( err );
        expect( data ).to.be.jsonSchema( schemaVoiceList );
        done();
    });
  });

  it('should return a single voice', function(done){
    
    var p = new PollyS3();
    
    p.randomVoice( null, function( err, data ){
        if( err ) throw( err );
        console.log( data );
        expect( data ).to.be.jsonSchema( schemaVoice );
        done();
    });
  });

  it('should return a random english voice', function(done){
    
    var p = new PollyS3();
    
    p.randomVoice( english_langauges, function( err, data ){
        if( err ) throw( err );
        console.log( data );
        expect( data ).to.be.jsonSchema( schemaVoice );
        done();
    });
  });

  it('should return a URL for a call to renderSentence when sentence is plaintext', function(done){

    var p = new PollyS3();
    var sentence = "Is this thing on?";

    p.renderSentence( sentence, null, function( err, url ){
        if( err ) throw(err);
        console.log( url );
        // TODO: more detailed testing of url?
        expect( url ).to.contain.hostname( 'amazonaws.com' );
        expect( url ).to.contain.path( 'mp3' );
        done();
    });
  });

  it('should return a URL for a call to renderSentence when sentence is SSML', function(done){

    var p = new PollyS3();
    var sentence = "<speak>Is this thing on?</speak>";

    p.renderSentence( sentence, null, function( err, url ){
        if( err ) throw(err);
        console.log( url );
        // TODO: more detailed testing of url?
        expect( url ).to.contain.hostname( 'amazonaws.com' );
        expect( url ).to.contain.path( 'mp3' );
        done();
    });
  });

});