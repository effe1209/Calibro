import React, { useState, Children, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

import './componentCSS/Stepper.css';

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  onCancel,
  cancelButtonText = "Annulla",
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  isDark,
  ...rest
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const indicatorRowRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  useLayoutEffect(() => {
    const row = indicatorRowRef.current;
    const activeIndicator = row?.children[(currentStep - 1) * 2];
    if (!row || !activeIndicator || row.scrollWidth <= row.clientWidth) return;

    const rowRect = row.getBoundingClientRect();
    const indicatorRect = activeIndicator.getBoundingClientRect();
    const nextScrollLeft = row.scrollLeft
      + indicatorRect.left
      - rowRect.left
      - (row.clientWidth - indicatorRect.width) / 2;
    row.scrollTo({
      left: Math.max(0, nextScrollLeft),
      behavior: isCompactViewport || prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [currentStep, isCompactViewport, prefersReducedMotion]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateViewport = (event) => setIsCompactViewport(event.matches);
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  const updateStep = newStep => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className="outer-container" {...rest}>
      <div className={`step-circle-container ${stepCircleContainerClassName}`}>
        <div ref={indicatorRowRef} className={`step-indicator-row ${stepContainerClassName}`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                    isDark={isDark}
                    reduceMotion={prefersReducedMotion}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector
                    isComplete={currentStep > stepNumber}
                    isDark={isDark}
                    reduceMotion={prefersReducedMotion}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          isCompactViewport={isCompactViewport}
          reduceMotion={prefersReducedMotion}
          className={`step-content-default ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`footer-container ${footerClassName}`}>
          <div className="footer-nav spread">
    

      {currentStep !== 1 && (
        <button
          type="button"
          onClick={handleBack}
          className="back-button"
          {...backButtonProps}
        >
          {backButtonText}
        </button>
      )}
      {/* L'utente può interrompere l'inserimento da qualunque passaggio. */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="back-button danger-button"
        >
          {cancelButtonText}
        </button>
      )}

      {/* TASTO AVANTI / SALVA */}
      <button
        type="button"
        className={`${nextButtonProps.className || ''} next-button ${isLastStep ? 'success-button' : ''}`}
        onClick={isLastStep ? handleComplete : handleNext}
        {...nextButtonProps}
      >
        {isLastStep ? 'Salva' : nextButtonText}
      </button>
    </div>

</div>
        )}
      </div>
    </div>
  );
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  isCompactViewport,
  reduceMotion,
  children,
  className,
}) {
  const [parentHeight, setParentHeight] = useState(0);
  const handleHeightReady = useCallback((height) => setParentHeight(height), []);

  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={isCompactViewport || reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={handleHeightReady}
            isCompactViewport={isCompactViewport}
            reduceMotion={reduceMotion}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, onHeightReady, isCompactViewport, reduceMotion }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // 1. Crea un Observer che ascolta i cambiamenti di dimensione del contenuto
    const resizeObserver = new ResizeObserver(() => {
      // Ogni volta che il contenuto cambia dimensione (es. immagine caricata), aggiorna l'altezza
      onHeightReady(element.offsetHeight);
    });

    onHeightReady(element.offsetHeight);
    // 2. Inizia ad osservare il div
    resizeObserver.observe(element);

    // 3. Pulizia quando il componente viene smontato
    return () => resizeObserver.disconnect();
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: reduceMotion ? 0 : isCompactViewport ? 0.18 : 0.4, ease: 'easeOut' }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: dir => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: dir => ({
    x: dir >= 0 ? '-50%' : '50%',
    opacity: 0
  })
};

export function Step({ children }) {
  return <div className="step-default">{children}</div>;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators, isDark, reduceMotion }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <motion.div onClick={handleClick} className="step-indicator" animate={status} initial={false}>
      <motion.div
      key={isDark ? "dark" : "light"}
        variants={{
          inactive: { scale: 1, backgroundColor: isDark ? 'var(--bg-card_DARK)' : '#FFFFFF', 
      color: isDark ? 'var(--text-primary_DARK)' : '#000000' },
          active: { scale: 1, backgroundColor: isDark ? 'var(--accent-primary_DARK)' : 'var(--accent-primary)',
      color: isDark ? '#172630' : '#FFFFFF' },
          complete: { scale: 1, backgroundColor: isDark ? 'var(--accent-primary_DARK)' : 'var(--accent-primary)',
      color: isDark ? '#172630' : '#FFFFFF' }
        }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
        className="step-indicator-inner"
      >
        {status === 'complete' ? (
          <CheckIcon className="check-icon" style={{ color: isDark ? '#172630' : '#FFFFFF' }} />
        ) : status === 'active' ? (
          <div className="active-dot" style={{ backgroundColor: isDark ? '#172630' : '#FFFFFF' }} />
        ) : (
          <span className="step-number">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete, isDark, reduceMotion }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: isDark ? 'var(--accent-primary_DARK)' : 'var(--accent-primary)' }
  };

  return (
    <div className="step-connector">
      <motion.div
        className="step-connector-inner"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
      />
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: 'tween', ease: 'easeOut', duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
