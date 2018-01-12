var chai = require('chai');
chai.use(require('chai-json-schema'));

//var should = chai.should();
var assert = chai.assert;

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
    
    var p = new PollyS3({
        region: "eu-west-1"
    });
    
    p.describeVoices( function( err, data ){
        if( err ){
            throw( err );
        } else if( data ){
            // TODO: check data is structured as expected
            console.log( data );
            assert.jsonSchema( data, schemaVoiceList );
            done();    
        }
    });
  });

});