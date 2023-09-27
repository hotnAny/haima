import React, { useEffect, useState } from 'react';
import jsYaml from 'js-yaml';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.module.css";

function App() {
  const [data, setData] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [transcript, setTranscript] = useState("")
  const [overallAnalysis, setOverallAnalysis] = useState("")

  useEffect(() => {
    // Fetch the YAML file
    fetch('/data.yml') // The path is relative to the public directory
      .then((response) => response.text())
      .then((yamlData) => {
        // Parse the YAML data
        const parsedData = jsYaml.load(yamlData);
        setData(parsedData);
        setMeetings(parsedData.meetings);

      })
      .catch((error) => {
        console.error('Error loading or parsing YAML file:', error);
      });
  }, []);

  const handleMeetingClick = (meeting) => {
    // Fetch the transcript text based on the filename
    fetch(`/transcripts/${meeting.transcriptFile}`) // Adjust the path as needed
      .then((response) => response.text())
      .then((transcriptText) => {
        // display the transcript
        // setSelectedMeeting({ ...meeting, transcriptText });
        setTranscript(transcriptText)

        // generate an overall summary (of clarity)
        // requestAnalysis(transcriptText, 'OVERALL CLARITY')
        // requestAnalysis(transcriptText, 'SPECIFIC CLARITY')

        const jsonString = '[{"speech": "so we did a workshop on Tuesday we got nine participants and we show you the results", "analysis": "The speaker should slow down their speech and enunciate each word clearly to improve clarity."}, {"speech": "So for the first session we just asked participants to come up with some ICS, bring some things. For example, we\'d like to share lab space or open the fridge or in the parking lot, a tourist attraction, something like that.", "analysis": "The speaker should break down their sentences into shorter, more concise phrases to improve clarity."}, {"speech": "So I\'m trying to code them but I\'m not sure. This is something I would like to discuss.", "analysis": "The speaker should rephrase the sentence to be more clear and concise, such as I would like to discuss how to code these goals and average utilizations."}]';

        const suggestions = JSON.parse(jsonString);
        if (Array.isArray(suggestions)) {
          console.log(suggestions);
        } else {
          console.error('The parsed response is not an array.');
        }


        // setTimeout(() => {
        //   // if (selectedMeeting != null) {
        //   const sentence = "so we did a workshop on Tuesday we got a nine participants and we show you the results";
        //   // const sentence = "Speaker"
        //   setTranscript(transcript.replace(sentence, "<span className='bg-warning'>" + sentence + "</span>"));
        //   // console.log(transcript.replace(sentence, "<span className='bg-warning'>" + sentence + "</span>"))
        //   // }
        // }, 1000);


      })
      .catch((error) => {
        console.error('Error loading transcript:', error);
      });
  };

  async function requestAnalysis(transcript, analysisType) {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: transcript, analysisType: analysisType }),
      });

      console.log('request sent')

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      console.info(data.result)
      switch (analysisType) {
        case 'OVERALL CLARITY':
          setOverallAnalysis(data.result)
          break;
        case 'SPECIFIC CLARITY':
          const suggestions = JSON.parse(data.result);
          if (Array.isArray(suggestions)) {
            console.log(suggestions);
          } else {
            console.error('The parsed response is not an array.');
          }
          break;
        default:
          break;
      }


      // setResult(data.result);
      // setAnimalInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      // alert(error.message);
    }
  }

  return (
    <div className="row p-2">
      <div className="col- p-3" style={{ width: '15%' }}>
        <h3>Meetings</h3>
        <div>
          <ul>
            {meetings.map((meeting) => (
              <li
                onClick={() => handleMeetingClick(meeting)} // Add click handler
                className={selectedMeeting?.id === meeting.id ? 'selected' : ''}
              >
                <div className="meeting-info">
                  <h2>{meeting.title}</h2>
                  <p>Start: {new Date(meeting.start).toLocaleString()}</p>
                  <p>End: {new Date(meeting.end).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="col- p-3" style={{ width: '45%' }}>
        <h3>Transcript</h3>
        <div style={{ maxHeight: '90vh', maxWidth: '100%', overflowY: 'auto' }}>
          {/* {selectedMeeting && ( */}
          {/* <pre style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: transcript }}></pre> */}
          <pre style={{ whiteSpace: 'pre-wrap' }}>{transcript}</pre>
          {/* {selectedMeeting.transcriptText} )} */}
        </div>
      </div>
      <div className="col- p-3" style={{ width: '40%' }}>

        <div className='row- p-2'>
          <h3>Overall Analysis</h3>
          <p>{overallAnalysis}</p>
        </div>

        <div className='row- p-2'>
          <h3>Specific Suggestions</h3>

        </div>
      </div>
    </div>
  );
}

export default App;