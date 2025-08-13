import React from 'react';

const ItineraryCard = ({ icon, dayTitle, morning, afternoon, evening }) => {
  return (
    <div className="itinerary-day-card" style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(160, 132, 232, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}>
      <div className="day-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(160, 132, 232, 0.2)'
      }}>
        <div className="day-icon" style={{
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.1) 0%, rgba(109, 59, 189, 0.1) 100%)',
          borderRadius: '50%',
          border: '2px solid rgba(160, 132, 232, 0.3)'
        }}>
          {icon}
        </div>
        <div className="day-title">
          <h4 style={{
            margin: 0,
            fontFamily: 'Rajdhani, Orbitron, sans-serif',
            fontWeight: 700,
            fontSize: '1.3rem',
            color: '#2a0140',
            lineHeight: 1.2
          }}>{dayTitle}</h4>
        </div>
      </div>
      
      <div className="time-sections" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {morning && (
          <div className="time-section" style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid rgba(160, 132, 232, 0.1)'
          }}>
            <div className="time-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(160, 132, 232, 0.1)'
            }}>
              <span className="time-icon">🌅</span>
              <span className="time-label" style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#6d3bbd',
                fontFamily: 'Rajdhani, Orbitron, sans-serif'
              }}>**Morning:**</span>
            </div>
            <div className="activities-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {morning.split('•').filter(item => item.trim()).map((activity, index) => (
                <div key={index} className="activity-item" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.5
                }}>
                  <span className="bullet" style={{
                    color: '#a084e8',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    lineHeight: 1,
                    marginTop: '0.1rem'
                  }}>•</span>
                  <span className="activity-text" style={{
                    color: '#2a0140',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    flex: 1
                  }}>{activity.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {afternoon && (
          <div className="time-section" style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid rgba(160, 132, 232, 0.1)'
          }}>
            <div className="time-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(160, 132, 232, 0.1)'
            }}>
              <span className="time-icon">☀️</span>
              <span className="time-label" style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#6d3bbd',
                fontFamily: 'Rajdhani, Orbitron, sans-serif'
              }}>**Afternoon:**</span>
            </div>
            <div className="activities-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {afternoon.split('•').filter(item => item.trim()).map((activity, index) => (
                <div key={index} className="activity-item" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.5
                }}>
                  <span className="bullet" style={{
                    color: '#a084e8',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    lineHeight: 1,
                    marginTop: '0.1rem'
                  }}>•</span>
                  <span className="activity-text" style={{
                    color: '#2a0140',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    flex: 1
                  }}>{activity.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {evening && (
          <div className="time-section" style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid rgba(160, 132, 232, 0.1)'
          }}>
            <div className="time-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(160, 132, 232, 0.1)'
            }}>
              <span className="time-icon">🌆</span>
              <span className="time-label" style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#6d3bbd',
                fontFamily: 'Rajdhani, Orbitron, sans-serif'
              }}>**Evening:**</span>
            </div>
            <div className="activities-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {evening.split('•').filter(item => item.trim()).map((activity, index) => (
                <div key={index} className="activity-item" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.5
                }}>
                  <span className="bullet" style={{
                    color: '#a084e8',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    lineHeight: 1,
                    marginTop: '0.1rem'
                  }}>•</span>
                  <span className="activity-text" style={{
                    color: '#2a0140',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    flex: 1
                  }}>{activity.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryCard; 