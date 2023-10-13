import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
    // console.log('starting')
    // if (!configuration.apiKey) {
    //     res.status(500).json({
    //         error: {
    //             message: "OpenAI API key not configured, please follow instructions in README.md",
    //         }
    //     });
    //     return;
    // }

    const transcript = req.body.transcript || '';
    const analysisType = req.body.analysisType || 'OVERALL CLARITY'

    //   const animal = req.body.animal || '';
    //   if (animal.trim().length === 0) {
    //     res.status(400).json({
    //       error: {
    //         message: "Please enter a valid animal",
    //       }
    //     });
    //     return;
    //   }

    const prompt = generatePrompt(transcript, analysisType)
    // console.log(prompt)

    // res.status(200).json({ result: prompt });

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo-16k",
            messages: [{role: "user", content: prompt}],
            temperature: 0,
        });
        res.status(200).json({ result: completion.data.choices[0].message.content });
    } catch (error) {
        // Consider adjusting the error handling logic for your use case
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
                }
            });
        }
    }

    
}

function generatePrompt(transcript, analysisType) {
    switch(analysisType) {
        case 'OVERALL CLARITY':
            return "based on the following transcript, can you assess the clarity of speaker 1' speeches? " + transcript;
        case 'SPECIFIC CLARITY':
            return 'based on the following transcript, can you provide three to five most significant examples where speaker 1 can improve the clarity of speech. format your response as [{"speech": "...", "analysis": "..."}, {"speech": "...", "analysis": "..."}, ...] where "speech" is a a substring of the transcript that is part of speaker 1\'s speech and that has clarity issue and "analysis" is your analysis on how to improve that sentence"s clarity. finally, fix your response to make it a valid JSON string. ' + transcript;
        default:
            return "no analysis type specified. please do nothing.";
    }
}
