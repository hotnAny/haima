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
  const [specificAnalyses, setSpecificAnalyses] = useState([])
  let idxSpecificAnalysis = -1

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

    // add keyboard input
    // document.body.addEventListener('keydown', handleKeyPress);

  }, []);

  const handleKeyPress = (event) => {
    // event.preventDefault()

    // setTranscript(selectedMeeting.transcriptText)

    if (specificAnalyses.length == 0) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      // console.log('Left arrow key pressed!');

      idxSpecificAnalysis = (idxSpecificAnalysis + specificAnalyses.length - 1) % specificAnalyses.length
      showNextSpecificAnalysis()

    } else if (event.key === 'ArrowRight') {

      idxSpecificAnalysis = (idxSpecificAnalysis + 1) % specificAnalyses.length
      showNextSpecificAnalysis()
    }

  }

  const showNextSpecificAnalysis = () => {
    if (specificAnalyses.length == 0) {
      return;
    }
    const analysis = specificAnalyses[idxSpecificAnalysis];
    console.log(idxSpecificAnalysis, analysis.speech);
    const pTranscript = document.getElementById('pTranscript');
    pTranscript.innerHTML = selectedMeeting.transcriptText.replace(analysis.speech, "<span class='bg-warning'>" + analysis.speech + "</span>");
    const pSpecificAnalysis = document.getElementById('pSpecificAnalysis');
    pSpecificAnalysis.innerHTML = analysis.analysis;

    setTimeout(() => {
      const spanSpeech = document.getElementsByClassName('bg-warning')[0];
      if (spanSpeech != undefined) {
        const pos = spanSpeech.offsetTop;
        const divTranscript = document.getElementById('divTranscript');
        divTranscript.scrollTop = pos - divTranscript.offsetHeight / 2;
      }
    }, 250);
  }

  const handleMeetingClick = (meeting) => {
    // Fetch the transcript text based on the filename
    fetch(`/transcripts/${meeting.transcriptFile}`) // Adjust the path as needed
      .then((response) => response.text())
      .then((transcriptText) => {
        // display the transcript
        setSelectedMeeting({ ...meeting, transcriptText });
        setTranscript(transcriptText)

        // generate an overall summary (of clarity)
        requestAnalysis(transcriptText, 'OVERALL CLARITY')

        setTimeout(() => {
          requestAnalysis(transcriptText, 'SPECIFIC CLARITY')
        }, 1000);


        // const jsonString = '[{"speech": "so we did a workshop on Tuesday we got a nine participants and we show you the results", "analysis": "The speaker should slow down their speech and enunciate each word clearly to improve clarity."}, {"speech": "So for the for the first session we just asked participant to come up with some ICS just bring some some things so, for example, we\'d like to share lab space or on the open the fridge or like in the parking lot a tourist attraction, something like that", "analysis": "The speaker should break down their sentences into shorter, more concise phrases to improve clarity."}, {"speech": "So I\'m trying to code or code them but I\'m not sure so, this is something I would like to discuss.", "analysis": "The speaker should rephrase the sentence to be more clear and concise, such as I would like to discuss how to code these goals and average utilizations."}]';

        // const suggestions = JSON.parse(jsonString);
        // if (Array.isArray(suggestions)) {
        //   // console.log(suggestions);
        //   setSpecificAnalyses(suggestions)

        // } else {
        //   console.error('The parsed response is not an array.');
        // }


        // setTimeout(() => {
        //   // if (selectedMeeting != null) {
        // const sentence = "so we did a workshop on Tuesday we got a nine participants and we show you the results";
        // // const sentence = "Speaker"
        // const pTranscript = document.getElementById('pTranscript');
        // console.log(pTranscript)
        // pTranscript.innerHTML = pTranscript.innerHTML.replace(sentence, "<span class='bg-warning'>" + sentence + "</span>")
        // setTranscript(transcript.replace(sentence, "<span className='bg-warning'>" + sentence + "</span>"));
        //   // console.log(transcript.replace(sentence, "<span className='bg-warning'>" + sentence + "</span>"))
        //   // }
        // console.log(specificAnalyses)
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
            setSpecificAnalyses(suggestions)
          } else {
            console.error('The parsed response is not an array.');
          }
          break;
        default:
          break;
      }

    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      // alert(error.message);
    }
  }

  return (
    <div tabIndex="0" className="row p-2" onKeyDown={handleKeyPress}>
      <div className="col- p-3" style={{ width: '20%' }}>
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
        <div id="divTranscript" style={{ maxHeight: '90vh', maxWidth: '100%', overflowY: 'auto' }}>
          {/* <pre style={{ whiteSpace: 'pre-wrap' }}>{transcript}</pre> */}
          <p id="pTranscript" style={{ whiteSpace: 'pre-line' }}>{transcript}</p>
        </div>
      </div>
      <div className="col- p-3" style={{ width: '35%' }}>

        <div className='row- p-2'>
          <h3>Overall Analysis</h3>
          <p>{overallAnalysis}</p>
        </div>

        <div className='row- p-2'>
          <h3>Specific Analysis</h3>
          <p id="pSpecificAnalysis"></p>
        </div>
      </div>
    </div>
  );
}

export default App;