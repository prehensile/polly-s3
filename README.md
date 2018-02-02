# polly-s3 

## Overview

polly-s3 is a node.js module which renders text-to-speech using AWS Polly and saves it in an S3 bucket.

You can use this module to render Polly speech on-the-fly for use in voice applications. If the S3 bucket has a public access policy, the rendered speech will be available at an HTTPS URL, suitable for use in an Alexa skill.

## Basic use

```
var PollyS3 = require('polly-s3');

var p = new PollyS3();

var sentence = "Is this thing on?";

p.renderSentence( sentence, null, function( err, url ){
    if( err ) throw(err);
    console.log( "Rendered speech is at URL:", url );
});


```

## TODO

### Security / privacy
- Implement expiry dates / sweep for old audio files in the S3 bucket and delete them
- Implement signed S3 one-time URLs as an option

### Polly features
- Lexicons