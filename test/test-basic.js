var chai = require('chai');
var should = chai.should();

var PollyS3 = require( "../src/polly-s3" );

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
            done();    
        }
    });
  });
});