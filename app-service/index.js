const { Configuration, OpenAIApi } = require("openai");
const { getSubtitles } = require('youtube-captions-scraper');
const { StatusCodes } = require('http-status-codes');
const createError = require('http-errors');
const { createResponse, returnErrorObj} = require("./utils");
const middlewares = require("./utils");

const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION_KEY,
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getTextFromYoutubeChanel = async (videoID) =>{

  if (!videoID) {
    throw new createError.BadRequest(returnErrorObj({
      message: 'The path parameter "videoId" is required.'
    }));
  }

  try{
    const textCaptions = await getSubtitles({
      videoID, // youtube video id
      lang: 'en' // default: `en`
    }).then((captions) => {
      let text = ''
      captions.forEach((items) => {
        text = text + items.text + ' '
      })
      return text;
    });

    console.log('Captions: ', textCaptions)
    return textCaptions
  } catch (e) {
    console.log('Something\'s wrong, Details: ', e.message)
    throw new createError.BadRequest(returnErrorObj({
      message: 'The path parameter "videoId" is required.'
    }));
  }
}

const getTradeIdeas = async (text) => {

  if (!text) {
    throw new createError.BadRequest(returnErrorObj({
      message: 'No subtitles for the GPT query'
    }));
  }

  try{

    const prompt = `
    Based on this text: "${text}" create me JSON with fields: title title to text; description brief description of selected shares; start_date date in ISO8601 format with time zone when you must buy shares; end_date date in ISO8601 format with time zone when you must sell shares; assets field array of objects with fields: percentage in decimal form which means how many shares you must buy relative to others, sum of percentage fields in array must equal 1; asset_ticker which shows share ticker.
    `

    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1024,
        temperature: 1,
        top_p: 1,
        n: 1,
        stream: false,
        logprobs: null,
      }
    );

    const textResponce = response.data.choices[0].text
    console.log('GPT responce: ', textResponce)

    return JSON.parse(textResponce)
  } catch (e) {
    console.error(e.message)
    throw new createError.BadRequest(returnErrorObj({
      message: e.message
    }));
  }
}

const getIdeas = async (event) => {
  const { queryStringParameters } = event
  const { videoId } = queryStringParameters

  const text = await getTextFromYoutubeChanel(videoId)
  const ideas = await getTradeIdeas(text)

  if (!ideas) {
    throw new createError.BadRequest(returnErrorObj({
      message: 'GPT did not respond'
    }));
  }

  console.log('Ideas: ', JSON.stringify(ideas, null, 2))
  return createResponse(StatusCodes.OK, ideas);
};

module.exports.handler = middlewares.common(getIdeas);