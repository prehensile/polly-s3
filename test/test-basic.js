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
var schemaVoiceList = {
    title : 'Voice list schema',
    type : 'array',
    minItems: 1,
    uniqueItems: true,
    items: {
        'type' : 'object',
        properties: {
            'Gender' : 'string',
            'Id' : 'string',
            'LanguageCode' : 'string',
            'LanguageName' : 'string',
            'Name' : 'string'
        },
        required : [ 'Gender','Id','LanguageCode','LanguageName','Name' ]
    }
};


describe('Basic tests', function() {
  
  it('should list ALL voices', function(done){
    
    var p = new PollyS3();
    
    p.describeVoices( function( err, data ){
        if( err ) throw( err );
        expect( data ).to.be.jsonSchema( schemaVoiceList );
        done();
    });
  });

  it('should return a URL for a call to renderSentence', function(done){

    var p = new PollyS3();
    var sentence = "Is this thing on?";

    p.renderSentence( sentence, function( err, url ){
        if( err ) throw(err);
        expect( url ).to.contain.hostname( 'amazonaws.com' );
        expect( url ).to.contain.path( 'mp3' );
        done();
    });
  });

});