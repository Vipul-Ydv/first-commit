import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiUsers, HiLocationMarker, HiShieldCheck, 
  HiLightningBolt, HiStar, HiCalendar 
} from 'react-icons/hi';

function Landing() {
  const features = [
    {
      icon: <HiShieldCheck className="h-8 w-8" />,
      title: 'Verified Identity',
      description: 'Verify with your college email and get a trusted badge'
    },
    {
      icon: <HiLightningBolt className="h-8 w-8" />,
      title: 'AI Skill Matching',
      description: 'Smart algorithm finds complementary teammates'
    },
    {
      icon: <HiUsers className="h-8 w-8" />,
      title: 'Team Finder',
      description: 'Create or join teams for hackathons and events'
    },
    {
      icon: <HiLocationMarker className="h-8 w-8" />,
      title: 'Location Discovery',
      description: 'Find like-minded people at events and summits'
    },
    {
      icon: <HiCalendar className="h-8 w-8" />,
      title: 'Event Check-in',
      description: 'QR code check-in to connect with attendees'
    },
    {
      icon: <HiStar className="h-8 w-8" />,
      title: 'Hackathon History',
      description: 'Showcase your past achievements and wins'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm">Live Now - Bharat Builds Tour</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="text-aws-orange"> Hackathon Team</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Verify your student identity, get matched with complementary skills, 
              and connect with like-minded developers at events near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-aws-orange text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-500 transition-all transform hover:scale-105 shadow-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">10K+</div>
              <div className="text-gray-600 mt-1">Students</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">500+</div>
              <div className="text-gray-600 mt-1">Teams Formed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">100+</div>
              <div className="text-gray-600 mt-1">Colleges</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">50+</div>
              <div className="text-gray-600 mt-1">Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to build your team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From identity verification to AI-powered matching, we've got you covered
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to find your perfect team
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Verify & Create Profile</h3>
              <p className="text-gray-600">Sign up with your college email and add your skills and interests</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-gray-600">Our AI finds teammates with complementary skills for you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Build & Win</h3>
              <p className="text-gray-600">Connect, collaborate, and build amazing projects together</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to find your team?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students building the future together
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-aws-orange text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-orange-500 transition-all transform hover:scale-105"
          >
            Start Now - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>Built with ❤️ for Bharat Builds Tour | ConnectCampus © 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
