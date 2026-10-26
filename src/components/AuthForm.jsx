import React, { useState } from 'react';
import './componentCSS/AuthForm.css'; 

const AuthForm = ({
  nickname,
  setNickname,
  email,
  setEmail,
  password,
  setPassword,
  handleRegister,
  handleLogin,
  handleKeyDown,
  isDark
}) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className={`auth-form-container${isDark ? ' auth-form-container--dark' : ''}`}>
      <div className="auth-content">
        <h2>
          {isLogin ? 'Accedi' : 'Registrati'}
        </h2>
        
        <div className="form-group">
          {!isLogin && (
            <div className="input-wrapper">
              <label htmlFor="nickname">Nickname</label>
              <input
                id="nickname"
                type="text"
                placeholder="Il tuo nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          <div className="input-wrapper">
              <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="input-wrapper">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="actions">
          <button 
            type="button"
            className="primary-btn"
            style={{ width: '100%', padding: '10px', cursor: 'pointer', marginTop: '1rem' }}
            onClick={isLogin ? handleLogin : handleRegister}
          >
            {isLogin ? 'Login' : 'Registrati'}
          </button>

          <p className="toggle-text">
            {isLogin ? "Non hai un account?" : "Hai già un account?"}{' '}
            <button
              type="button"
              className="toggle-link"
              onClick={() => setIsLogin((current) => !current)}
            >
              {isLogin ? 'Creane uno' : 'Accedi'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
