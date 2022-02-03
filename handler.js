const needle = require('needle');
// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const token = "AAAAAAAAAAAAAAAAAAAAAP0pYwEAAAAA7tbTpU6l5L7ypGNweYs6JsydUuI%3DsnKPijOSWqlF3AccVRyYiju59XP258x2QHyWbluCRxbDpiVVHo";
const endpointURL = "https://api.twitter.com/2/users/by?usernames=";

async function getRequest(username_) {
    var todayDate = new Date().toISOString().slice(0, 10);
    console.log(todayDate);
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

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request');
    }
}

export const hello = async (event, context) => {
  //const ans= await getRequest(event["queryStringParameters"]['UserName']);
  const ans= await getRequest('joebiden');
  return {
    statusCode: 200,
    body: JSON.stringify(ans,null,2),
  };
};
