import React, { useRef, useEffect, useState } from 'react';
import { FiPlusSquare } from 'react-icons/fi';
import { PiMinusSquare } from 'react-icons/pi';

interface AccordionProps {
  title: string;
  content: React.ReactNode;
  addOnClick?: () => void;
  removeOnClick?: () => void;
  removeIconClass?: string;
  addIconClass?: string;
  index: number;
  expandedAccordionIndex: number;
  handleAccordionClick: (accordionIndex: number) => void;
}

const Accordion = ({
  title,
  content,
  addOnClick,
  removeOnClick,
  removeIconClass,
  addIconClass,
  index,
  expandedAccordionIndex,
  handleAccordionClick,
}: AccordionProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<'0px' | 'auto' | `${number}px`>('0px');

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (expandedAccordionIndex === index) {
      const contentHeight = inner.scrollHeight;

      // set fixed height for animation
      setHeight(`${contentHeight}px`);

      // after animation, switch to auto (prevents clipping)
      const timeout = setTimeout(() => {
        setHeight('auto');
      }, 300); // must match transition duration

      return () => clearTimeout(timeout);
    } else {
      // closing: go from auto → px → 0
      if (height === 'auto') {
        const contentHeight = inner.scrollHeight;
        setHeight(`${contentHeight}px`);
        requestAnimationFrame(() => {
          setHeight('0px');
        });
      } else {
        setHeight('0px');
      }
    }
  }, [expandedAccordionIndex, index]);

  return (
    <div className="py-0">
      <button
        className="relative flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-white transition duration-300 ease-in-out"
        aria-expanded={expandedAccordionIndex === index}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAccordionClick(index);
        }}
        style={{
          background: 'linear-gradient(to right, #193043, #1e3a5f, #234466)',
          boxShadow:
            'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
        }}
      >
        <PiMinusSquare
          className={`absolute right-[-10px] top-1/2 z-20 cursor-pointer text-red-400 hover:text-red-300 ${
            removeIconClass || ''
          } -translate-y-1/2 translate-x-1/2 transform`}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            removeOnClick?.();
          }}
        />

        <FiPlusSquare
          className={`absolute left-[-23px] top-1/2 z-20 cursor-pointer text-green-400 hover:text-green-300 ${
            addIconClass || ''
          } -translate-y-1/2 translate-x-1/2 transform`}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            addOnClick?.();
          }}
        />

        {title}

        <svg
          className={`h-5 w-5 transition-transform ${
            expandedAccordionIndex === index ? 'rotate-180' : ''
          }`}
          viewBox="0 0 512 512"
          fill="white"
        >
          <path d="M256 217.9L383 345c9.4 9.4 24.6 9.4 33.9 0 9.4-9.4 9.3-24.6 0-34L273 167c-9.1-9.1-23.7-9.3-33.1-.7L95 310.9c-4.7 4.7-7 10.9-7 17s2.3 12.3 7 17c9.4 9.4 24.6 9.4 33.9 0l127.1-127z" />
        </svg>
      </button>

      <div
        ref={outerRef}
        className="overflow-hidden transition-all duration-300 ease-in-out px-1"
        style={{ height }}
        aria-hidden={expandedAccordionIndex !== index}
      >
        <div ref={innerRef} className="relative">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
