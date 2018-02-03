# polly-s3

## Overview

__polly-s3__ is a node.js module which renders text-to-speech using [AWS Polly](https://aws.amazon.com/polly/) and saves it to an audio file in an S3 bucket.

You can use this module to render Polly speech on-the-fly for use in voice applications. If the S3 bucket has a public access policy, the rendered speech will be available at an HTTPS URL, suitable for use in an Alexa skill.

So far it has mostly been used in AWS Lambda functions - an understanding of how to run code in an AWS context will come in handy while using this module.

## Install

`npm install polly-s3`

## Usage

### ⚠ Configuration

__polly-s3__ requires some configuration to be set before it will work properly.

The name of an S3 bucket to hold rendered speech files needs to be set in either an environment variable named `AWS_S3_DEFAULT_BUCKET` or passed in an options object to `new PollyS3()`, e.g `new PollyS3({ s3Bucket : 'someBucketName' })`. 

__polly-s3__ also needs to use an __AWS IAM role__ which has rights to both __use Polly__ and __write to the specified S3 bucket__. If running on AWS Lambda, you can create this IAM role and assign it to the Lambda function. If running elsewhere, you'll need to provide credentials using one of the methods described in the [AWS SDK for JavaScript docs](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html).

Similarly, the AWS region needs to be set. Information about that is also in the [AWS SDK for JavaScript docs](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html).

If you need to pass any options to the constructors for the Polly or S3 SDKs, you can pass a combined options object to the polly-s3 constructor; this object will be passed on to the Polly and S3 constructors.

### Example
```
var PollyS3 = require('polly-s3');

var p = new PollyS3();

var sentence = "Is this thing on?";

p.renderSentence( sentence, null, function( err, url ){
    if( err ) throw(err);
    console.log( "Rendered speech is at URL:", url );
});


```

## API

### renderSentence( sentence, voice, callback )

Render some speech.

Parameters:
 * __sentence__: the sentence to render. Can be plain text or SSML.
 * __voice__: the Polly voice ID to use for this sentence. Can be null; defaults to _'Brian'_.

### describeVoices( language, callback )

List Polly voices for a given language.

Returns data as described in the [AWS Polly docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#describeVoices-property).
 
Parameters:
* __language__: the language which voices to list, e.g. `en-US`. Can be a single string or an array, e.g. `[ 'en-GB', 'en-US', 'en-AU', 'en-IN', 'en-GB-WLS' ]` for all English voices.

### randomVoice( language, callback )

Fetch description for one voice, chosen at random from all in a given language.

Returns data as described in the [AWS Polly docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#describeVoices-property).
 
Parameters:
* __language__: the language which voices to list, e.g. `en-US`. Can be a single string or an array, e.g. `[ 'en-GB', 'en-US', 'en-AU', 'en-IN', 'en-GB-WLS' ]` for all English voices.

## Author

Henry Cooke <me@prehensile.co.uk> http://github.com/prehensile

## License

 - **MIT** : http://opensource.org/licenses/MIT

## TODO

### Security / privacy
- Implement expiry dates / sweep for old audio files in the S3 bucket and delete them
- Implement signed S3 one-time URLs as an option

### Polly features
- Lexicons
- Different audio file formats (currently hardcoded to MP3)

