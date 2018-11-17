var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

// const sourceQueue = "https://sqs.eu-west-1.amazonaws.com/012862735759/new-test";
const destinationQueue = "https://sqs.eu-west-1.amazonaws.com/012862735759/receive-queue";
const sourceQueue = 'https://sqs.eu-west-1.amazonaws.com/012862735759/ResponseQueueDeadLetterProd-B';
// const sourceQueue = 'https://sqs.eu-west-1.amazonaws.com/012862735759/newDLQ';
var params = {
 AttributeNames: [
    "SentTimestamp"
 ],
 MaxNumberOfMessages: 10,
 MessageAttributeNames: [
    "All"
 ],
 QueueUrl: sourceQueue,
 VisibilityTimeout: 20,
 WaitTimeSeconds: 0
};

sqs.receiveMessage(params, function(err, data) {
  if (err) {
    console.log("Receive Error", err);
  } else if (data.Messages) {
    console.log('message count:', data.Messages.length);
    data.Messages.forEach((message) => {

      console.log('message:', message)
      console.log('message.Body:', message.Body)
      console.log('type of body', typeof message.Body);
      const body = JSON.parse(message.Body)
      if (body.shortcode && body.shortcode.includes('%20')) {
        const shortcode = body.shortcode.replace('%20','');
        const newBody = {...body, shortcode }
        console.log('new body:', newBody);
        
        var sParams = {
 
        MessageBody: JSON.stringify(newBody),
         QueueUrl: destinationQueue
       };
       
       sqs.sendMessage(sParams, function(err, data) {
         if (err) {
           console.log("Error", err);
         } else {
           console.log("Success", data.MessageId);
          //  delete processed message
            var deleteParams = {
              QueueUrl: sourceQueue,
              ReceiptHandle: message.ReceiptHandle
            };
            sqs.deleteMessage(deleteParams, function(err, data) {
              if (err) {
                console.log("Delete Error", err);
              } else {
                console.log("Message Deleted", data);
              }
            });
         }
       });
      }
      

      
    })
      }
});



