import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * LivenessCheck verifies user presence using blink detection via MediaPipe Face Mesh.
 * It renders a webcam feed, tracks the EAR (Eye Aspect Ratio), and requires two blinks 
 * in succession before capturing a face snapshot and calling onVerified().
 */
const LivenessCheck = ({ onVerified, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('INITIALIZING'); // INITIALIZING, WAITING, BLINK_1, VERIFIED, FAILED
  const [debugMsg, setDebugMsg] = useState('Loading AI models...');
  
  const faceLandmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  // State machine refs
  const lastBlinkTimeRef = useRef(0);
  const blinkCountRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await new Promise(resolve => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          });
        }
      } catch (err) {
        console.error("Camera error:", err);
        setStatus('FAILED');
        setDebugMsg('Camera access denied or unavailable.');
      }
    }

    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        
        if (active) {
          await setupCamera();
          if (videoRef.current) {
            setStatus('WAITING');
            setDebugMsg('Please blink twice clearly to verify.');
            startDetection();

            // Fail if not verified in 15 seconds
            timeoutRef.current = setTimeout(() => {
              if (active) {
                setStatus('FAILED');
                setDebugMsg('Liveness validation timed out. Please try again.');
                stopDetection();
              }
            }, 15000);
          }
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err);
        setStatus('FAILED');
        setDebugMsg('Failed to load validation models.');
      }
    }

    initMediaPipe();

    return () => {
      active = false;
      stopDetection();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const calculateEAR = (landmarks, indices) => {
    // EAR = ( |p2-p6| + |p3-p5| ) / ( 2 * |p1-p4| )
    const [p1, p2, p3, p4, p5, p6] = indices.map(i => landmarks[i]);
    
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    
    // Vertical distances
    const v1 = dist(p2, p6);
    const v2 = dist(p3, p5);
    // Horizontal distance
    const h = dist(p1, p4);
    
    return (v1 + v2) / (2.0 * h);
  };

  const processFrame = async (video, nowInMs) => {
    if (!faceLandmarkerRef.current || !video) return;

    try {
      const results = faceLandmarkerRef.current.detectForVideo(video, nowInMs);
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        
        // Use standard left/right eye indices from Face Mesh
        // Left Eye: 33(inner), 160(top), 158(top), 133(outer), 153(bottom), 144(bottom)
        const leftEar = calculateEAR(landmarks, [33, 160, 158, 133, 153, 144]);
        
        // Right Eye: 362(inner), 385(top), 387(top), 263(outer), 373(bottom), 380(bottom)
        const rightEar = calculateEAR(landmarks, [362, 385, 387, 263, 373, 380]);
        
        const avgEar = (leftEar + rightEar) / 2.0;

        // Blink detection threshold (may need tuning, usually around 0.20 to 0.25)
        const BLINK_THRESHOLD = 0.21;
        const now = Date.now();

        if (avgEar < BLINK_THRESHOLD) {
          if (!isBlinkingRef.current) {
            isBlinkingRef.current = true; // Eye closed
          }
        } else {
          if (isBlinkingRef.current) {
            isBlinkingRef.current = false; // Eye opened -> Blink completed!
            
            // Debounce to avoid micro-blinks counting as multiple
            if (now - lastBlinkTimeRef.current > 300) {
              blinkCountRef.current += 1;
              lastBlinkTimeRef.current = now;

              if (blinkCountRef.current === 1) {
                setStatus('BLINK_1');
                setDebugMsg('One blink detected. Blink again.');
              } else if (blinkCountRef.current === 2) {
                // Verification successful
                setStatus('VERIFIED');
                setDebugMsg('Verified!');
                stopDetection();
                captureAndFinish();
              }
            }
          }
        }
      } else {
        if (status !== 'FAILED' && status !== 'VERIFIED') {
          setDebugMsg('No face detected. Please face the camera directly.');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startDetection = () => {
    let lastVideoTime = -1;
    
    const renderLoop = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && status !== 'VERIFIED' && status !== 'FAILED') {
        const nowInMs = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          processFrame(video, nowInMs);
        }
      }
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    
    animationRef.current = requestAnimationFrame(renderLoop);
  };

  const stopDetection = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const captureAndFinish = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      // Mirror image horizontally to match preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      onVerified(base64Image);
    }
  };

  return (
    <div className="liveness-modal-overlay" style={styles.overlay}>
      <div className="liveness-card" style={styles.card}>
        <h3 style={styles.title}>Identity Verification</h3>
        <p style={{...styles.msg, color: status === 'FAILED' ? 'var(--error)' : status === 'VERIFIED' ? 'var(--success)' : 'var(--text-secondary)'}}>
          {debugMsg}
        </p>
        
        <div style={styles.videoContainer}>
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            style={{...styles.video, filter: status === 'VERIFIED' ? 'brightness(1.2)' : 'none'}}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Overlay Status Frame */}
          <div style={{
            ...styles.frame, 
            borderColor: status === 'VERIFIED' ? 'var(--success)' : 
                         status === 'FAILED' ? 'var(--error)' : 
                         status === 'BLINK_1' ? 'var(--warning)' : 'var(--primary)'
          }}></div>
        </div>

        <div style={styles.actions}>
          {status === 'FAILED' ? (
            <button style={styles.btnPrimary} onClick={() => window.location.reload()}>Try Again</button>
          ) : (
            <button style={styles.btnSecondary} onClick={onCancel}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, backdropFilter: 'blur(4px)'
  },
  card: {
    backgroundColor: 'var(--bg-surface)', padding: '2rem',
    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px',
    boxShadow: 'var(--shadow-lg)', textAlign: 'center'
  },
  title: { margin: '0 0 0.5rem 0', color: 'var(--text-primary)' },
  msg: { margin: '0 0 1.5rem 0', fontSize: '0.875rem', fontWeight: 500, minHeight: '20px' },
  videoContainer: {
    position: 'relative', width: '100%', aspectRatio: '4/3',
    backgroundColor: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden',
    marginBottom: '1.5rem'
  },
  video: {
    width: '100%', height: '100%', objectFit: 'cover',
    transform: 'scaleX(-1)' // Mirroring
  },
  frame: {
    position: 'absolute', top: '10%', left: '15%', right: '15%', bottom: '10%',
    border: '3px dashed', borderRadius: '50%', pointerEvents: 'none',
    transition: 'border-color 0.3s ease'
  },
  actions: { display: 'flex', justifyContent: 'center', gap: '1rem' },
  btnSecondary: {
    padding: '0.5rem 1.5rem', border: '1px solid var(--border-strong)',
    background: 'transparent', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontWeight: 600
  },
  btnPrimary: {
    padding: '0.5rem 1.5rem', border: 'none',
    background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontWeight: 600
  }
};

export default LivenessCheck;
