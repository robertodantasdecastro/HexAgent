/**
 * SimpleTransition - Pure CSS transition component
 * Componente de transição CSS pura
 * 
 * Lightweight alternative to framer-motion's AnimatePresence
 * Alternativa leve ao AnimatePresence do framer-motion
 * 
 * @module SimpleTransition
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 * 
 * @example
 * <SimpleTransition show={isVisible} className="my-component">
 *   <div>Content</div>
 * </SimpleTransition>
 */

import { useEffect, useState } from 'react';

/**
 * Simple transition component using CSS
 * Componente de transição simples usando CSS
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements / Elementos filhos
 * @param {boolean} props.show - Show/hide state / Estado mostrar/ocultar
 * @param {string} [props.className=''] - Additional CSS classes / Classes CSS adicionais
 * @param {Object} [props.style={}] - Inline styles / Estilos inline
 * @param {number} [props.duration=300] - Transition duration in ms / Duração da transição em ms
 */
export function SimpleTransition({ 
  children, 
  show, 
  className = '', 
  style = {},
  duration = 300 
}) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Mount component / Montar componente
      setShouldRender(true);
      
      // Trigger animation after render / Disparar animação após render
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      // Hide with animation / Ocultar com animação
      setIsVisible(false);
      
      // Delay unmount for animation to complete / Atrasar desmontagem para animação completar
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`transition-all ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-in-out',
        ...style
      }}
    >
      {children}
    </div>
  );
}

/**
 * Slide transition variant / Variante de transição deslizante
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements / Elementos filhos
 * @param {boolean} props.show - Show/hide state / Estado mostrar/ocultar
 * @param {string} [props.direction='up'] - Slide direction: 'up', 'down', 'left', 'right'
 * @param {string} [props.className=''] - Additional CSS classes / Classes CSS adicionais
 * @param {Object} [props.style={}] - Inline styles / Estilos inline
 * @param {number} [props.duration=300] - Transition duration in ms / Duração da transição em ms
 */
export function SlideTransition({ 
  children, 
  show, 
  direction = 'up',
  className = '', 
  style = {},
  duration = 300 
}) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate transform based on direction / Calcular transformação baseada na direção
  const getTransform = (visible) => {
    if (visible) return 'translate(0, 0)';
    
    switch (direction) {
      case 'up': return 'translateY(20px)';
      case 'down': return 'translateY(-20px)';
      case 'left': return 'translateX(20px)';
      case 'right': return 'translateX(-20px)';
      default: return 'translateY(20px)';
    }
  };

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(isVisible),
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-in-out',
        ...style
      }}
    >
      {children}
    </div>
  );
}

/**
 * Height transition for collapsible sections / Transição de altura para seções colapsáveis
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements / Elementos filhos
 * @param {boolean} props.show - Show/hide state / Estado mostrar/ocultar
 * @param {string} [props.className=''] - Additional CSS classes / Classes CSS adicionais
 * @param {string} [props.height='auto'] - Target height when shown / Altura alvo quando mostrado
 * @param {number} [props.duration=300] - Transition duration in ms / Duração da transição em ms
 */
export function HeightTransition({ 
  children, 
  show, 
  className = '',
  height = 'auto',
  duration = 300 
}) {
  const [shouldRender, setShouldRender] = useState(show);
  const [currentHeight, setCurrentHeight] = useState(show ? height : '0');

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setCurrentHeight(height);
      });
    } else {
      setCurrentHeight('0');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, height, duration]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`overflow-hidden transition-all ${className}`}
      style={{
        height: currentHeight,
        opacity: currentHeight === '0' ? 0 : 1,
        transitionProperty: 'height, opacity',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-in-out'
      }}
    >
      {children}
    </div>
  );
}

export default SimpleTransition;
