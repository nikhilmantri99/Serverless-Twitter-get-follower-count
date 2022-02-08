import AWS from "aws-sdk";
const needle = require('needle');
const token = "AAAAAAAAAAAAAAAAAAAAAP0pYwEAAAAA7tbTpU6l5L7ypGNweYs6JsydUuI%3DsnKPijOSWqlF3AccVRyYiju59XP258x2QHyWbluCRxbDpiVVHo";
const endpointURL = "https://api.twitter.com/2/users/by?usernames=";


async function getRequest(username_) {
    // These are the parameters for the API request
    // specify User names to fetch, and any additional fields that are required
    // by default, only the User ID, name and user name are returned
    const params = {
        usernames: username_, // Edit usernames to look up
        "user.fields": "public_metrics", // Edit optional query parameters here
        //"expansions": "pinned_tweet_id"
    };

    // this is the HTTP header that adds bearer token authentication
    const res = await needle('get', endpointURL, params, {
        headers: {
            "User-Agent": "v2UserLookupJS",
            "authorization": `Bearer ${token}`
        }
    });

    if (res.body==null) {
        return new Error('Unsuccessful request');
    }
    var todayDate = new Date().toISOString().slice(0, 10);
    console.log(todayDate);
    const new_val={
        username : res.body.data[0].username,
        name: res.body.data[0].name,
        id: res.body.data[0].id,
        date: todayDate,
        followers_count: res.body.data[0].public_metrics.followers_count,
        following_count: res.body.data[0].public_metrics.following_count,
        tweet_count: res.body.data[0].public_metrics.tweet_count,
    };
    AWS.config.update({region:'us-east-1'});
    const dynamoDb = new AWS.DynamoDB.DocumentClient();
    const get_back = {
        TableName: "store-twitter-follower-info",
        Key: {
            username: res.body.data[0].username, // The id of the author
        },
    };

    const oldresult = await dynamoDb.get(get_back).promise();
    var ls=[];
    if(oldresult!=null && oldresult.Item!=null){
        ls=oldresult.Item.info;
        var n=ls.length;
        if(ls[n-1].date!=new_val.date){
            ls.push(new_val);
        }
        else{
            ls[n-1]=new_val;
        }
    }
    else{
        //put this new primary key in a variable inside the same table
        const primary_key_list={
            TableName: get_back.TableName,
            Key: {
                username: "allPrimaryKeys",
            },
        };
        const allold_Pkeys = await dynamoDb.get(primary_key_list).promise();
        var corr_ls=[];
        if(allold_Pkeys!=null && allold_Pkeys.Item!=null){
            corr_ls=allold_Pkeys.Item.info;
        }
        console.log(get_back.Key.username);
        corr_ls.push(get_back.Key.username);
        const params_={
            TableName: get_back.TableName,
            Item:{
                username: primary_key_list.Key.username,
                info: corr_ls,
            }
        }
        await dynamoDb.put(params_).promise();
        //update the empty list with a val for the new username
        ls.push(new_val);
    }
    const paramsnew={
        TableName: get_back.TableName,
        Item:{
            username: get_back.Key.username,
            info: ls,
        }
    }
    try{
        await dynamoDb.put(paramsnew).promise();
    }
    catch(e){
        console.log("Error is found....");
        console.log(e);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message }),
        };
    }
    return ls;
}

export const hello = async (event, context) => {
  const ans= await getRequest(event["queryStringParameters"]['UserName']);
  //const ans= await getRequest('joebiden');
  return {
    statusCode: 200,
    body: JSON.stringify(ans,null,2),
  };
};

export const updateTable = async (event, context) => {
    var ans= "Now updating the table's usernames with the latest values";
    const primary_key_list={
        TableName: "store-twitter-follower-info",
        Key: {
            username: "allPrimaryKeys",
        },
    };
    const dynamoDb_helper = new AWS.DynamoDB.DocumentClient();
    const all_Pkeys = await dynamoDb_helper.get(primary_key_list).promise();
    if(all_Pkeys!=null && all_Pkeys.Item!=null){
        var ls=[];
        ls=all_Pkeys.Item.info;
        for(var i=0;i<ls.length;i++){
            await getRequest(ls[i]);
        }
    }
    return {
        statusCode: 200,
        body: "Table updated !",
    };
};