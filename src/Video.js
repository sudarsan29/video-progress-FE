
import React, { useEffect, useRef, useState } from 'react';
import './video.css';
import axios from 'axios';
import Swal from 'sweetalert2'; // SweetAlert2 import

const Video = () => {
  const videoRef = useRef(null);
  const [watchedIntervals, setWatchedIntervals] = useState([]);
  const [currentStart, setCurrentStart] = useState(null);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0); // State for video duration

  // Dummy userId and videoId for demo (replace with real data later)
  const userId = 'user123';
  const videoId = 'video456';

  // Track when video starts playing
  const handlePlay = () => {
    if (currentStart === null) {
      setCurrentStart(videoRef.current.currentTime);
    }
  };

  // Track when video pauses/stops
  const handlePause = () => {
    if (currentStart !== null) {
      const end = videoRef.current.currentTime;
      saveInterval(currentStart, end);
      setCurrentStart(null);
    }
  };

  // Save interval and call save API
  const saveInterval = (start, end) => {
    if (end > start) {
      const newInterval = { start: Math.floor(start), end: Math.floor(end) };
      const merged = mergeIntervals([...watchedIntervals, newInterval]);
      setWatchedIntervals(merged);

      const progressPercent = calculateProgressPercent(merged);
      saveVideoProgress(userId, videoId, merged, progressPercent);
    }
  };

  // Merge overlapping or adjacent intervals
  const mergeIntervals = (intervals) => {
    if (intervals.length === 0) return [];

    const sorted = intervals.sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];

      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }

    return merged;
  };

  // Calculate progress percent dynamically based on watched intervals and video duration
const calculateProgressPercent = (intervals) => {
  const uniqueWatched = intervals.reduce((sum, interval) => {
    return sum + (interval.end - interval.start);
  }, 0);

  // Ensure progress doesn't exceed 100%
  const percent = Math.min((uniqueWatched / videoDuration) * 100, 100);

  // Log the actual values
  console.log('Unique Watched Time:', uniqueWatched);
  console.log('Video Duration:', videoDuration);
  console.log('Calculated Progress:', percent);

  return parseFloat(percent.toFixed(2));
};

  // Save progress to backend
  const saveVideoProgress = async (userId, videoId, intervals, percent) => {
    try {
      await axios.post('http://localhost:4000/api/update/save', {
        userId,
        videoId,
        watchedIntervals: intervals,
        updatePercent: percent,
        videoDuration: videoDuration, // Send duration too
      });

      console.log('Sending to backend:', {
        userId,
        videoId,
        watchedIntervals: intervals,
        videoDuration: videoDuration,
      });

      // SweetAlert popup on success
      Swal.fire({
        title: 'Progress Saved!',
        text: 'Your video progress has been successfully saved.',
        icon: 'success',
        confirmButtonText: 'Great!',
      });
    } catch (err) {
      console.error('Error saving progress:', err.message);

      // SweetAlert error message
      Swal.fire({
        title: 'Error!',
        text: 'There was an issue saving your progress. Please try again later.',
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  };

  // Fetch saved progress from backend
  const fetchVideoProgress = async (userId, videoId) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/update/${userId}/${videoId}`);
      console.log('Fetched progress:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching progress:', err.message);
      return null;
    }
  };

  // On load, fetch previous progress
  useEffect(() => {
    const loadProgress = async () => {
      const data = await fetchVideoProgress(userId, videoId);
      if (data && data.watchedIntervals) {
        setWatchedIntervals(data.watchedIntervals);
      }
    };
    loadProgress();
  }, []);

  // Set video duration when metadata is loaded
  const handleLoadedMetadata = () => {
    const duration = videoRef.current.duration;
    setVideoDuration(duration);
    console.log('Video Duration Set:', duration);
  };

  // Update progress % whenever intervals change
  useEffect(() => {
    if (videoDuration > 0) {
      const percent = calculateProgressPercent(watchedIntervals);
      setProgress(percent);
    }
  }, [watchedIntervals, videoDuration]);

  return (
    <div className="video-page-container">
      <h2>Lecture Video</h2>
      <video
        ref={videoRef}
        width="740"
        height="360"
        controls
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
        onLoadedMetadata={handleLoadedMetadata} // Event to set video duration
      >
        <source src="/videos/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="progress-container">
        <p><strong>Progress:</strong> {progress}%</p>
      </div>
    </div>
  );
};

export default Video;
