
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Activity, Heart, User, ArrowRight, ArrowLeft } from 'lucide-react';

const slides = [
  {
    title: 'Welcome to VitalSync',
    description: 'Your personal health companion for monitoring vital signs and predicting health risks.',
    icon: <Activity size={64} className="text-primary" />,
  },
  {
    title: 'Track Your Health',
    description: 'Monitor blood pressure, heart rate, temperature, oxygen levels and more in real-time.',
    icon: <Heart size={64} className="text-health-danger-500" />,
  },
  {
    title: 'Personalized Insights',
    description: 'Get AI-powered health predictions and recommendations based on your unique health profile.',
    icon: <User size={64} className="text-health-primary-500" />,
  },
];

const IntroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/signin');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center mb-8">
              {slides[currentSlide].icon}
            </div>
            <h1 className="text-3xl font-bold mb-4">{slides[currentSlide].title}</h1>
            <p className="text-muted-foreground mb-8">{slides[currentSlide].description}</p>
          </motion.div>
        </div>
      </div>

      <div className="p-6 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full ${
                index === currentSlide ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Button onClick={nextSlide} className="flex items-center gap-2">
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default IntroSlider;
