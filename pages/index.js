import React, { useEffect, useState } from 'react';
import jsYaml from 'js-yaml';
import styles from "./index.module.css";

function App() {
  const [data, setData] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

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
        setSelectedMeeting({ ...meeting, transcriptText });

        // generate an overall summary (of clarity)
        requestAnalysis(transcriptText, 'OVERALL CLARITY')

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

      // setResult(data.result);
      // setAnimalInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      // alert(error.message);
    }
  }

return (
  <div className={styles.main}>
    <div className={styles.column}>
      <h1>Meetings</h1>
      <div className="meeting-list">
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
    <div className={styles.column}>
      <div className="transcript">
        {selectedMeeting && (
          <>
            <pre>{selectedMeeting.transcriptText}</pre>
          </>
        )}
      </div>
    </div>
    <div className={styles.column}>Column 3</div>
  </div>
);
}

export default App;