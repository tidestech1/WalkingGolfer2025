import { FAQData } from '@/types/faq';

export const faqData: FAQData = {
  categories: [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'New to Walking Golfer? Start here to learn the basics.',
      icon: 'PlayCircle',
      items: [
        {
          id: 'what-is-walking-golfer',
          question: 'What is Walking Golfer?',
          answer: 'Walking Golfer is a platform dedicated to helping golfers find and review walkable golf courses across the United States. We focus specifically on courses that are friendly to golfers who prefer to walk rather than ride in golf carts.',
          category: 'getting-started',
          keywords: ['walking', 'golfer', 'platform', 'walkable', 'courses']
        },
        {
          id: 'do-i-need-account',
          question: 'Do I need an account to use Walking Golfer?',
          answer: 'You can browse courses and read reviews without an account. However, creating a free account allows you to leave reviews, save favorite courses, and personalize your experience with golf preferences and location settings.',
          category: 'getting-started',
          keywords: ['account', 'registration', 'free', 'browse', 'reviews']
        },
        {
          id: 'create-account',
          question: 'How do I create an account?',
          answer: 'Click "Sign Up" in the top navigation, then provide your email and create a password. You can also sign up using Google authentication for faster registration.',
          category: 'getting-started',
          keywords: ['signup', 'registration', 'google', 'email', 'password']
        },
        {
          id: 'complete-profile',
          question: 'Why should I complete my profile?',
          answer: 'Completing your profile helps us provide better course recommendations. You can add your golf experience level, preferred carry method (carry bag, push cart, etc.), handicap, location, and favorite states to golf in.',
          category: 'getting-started',
          keywords: ['profile', 'preferences', 'handicap', 'experience', 'recommendations']
        }
      ]
    },
    {
      id: 'finding-courses',
      name: 'Finding Courses',
      description: 'Learn how to search and find the perfect walkable courses.',
      icon: 'Search',
      items: [
        {
          id: 'search-courses',
          question: 'How do I search for golf courses?',
          answer: 'Use the search bar on the homepage or course finder page to search by course name, city, or state. You can also browse courses on our interactive map or use our advanced filters to find courses that match your preferences.',
          category: 'finding-courses',
          keywords: ['search', 'course finder', 'map', 'city', 'state', 'filters']
        },
        {
          id: 'use-filters',
          question: 'How do the course filters work?',
          answer: 'Our filters help you narrow down courses by walkability rating, club type (public, private, resort), number of holes (9 or 18), and location.',
          category: 'finding-courses',
          keywords: ['filters', 'walkability', 'public', 'private', 'resort', 'holes', 'facilities']
        },
        {
          id: 'map-feature',
          question: 'How does the map feature work?',
          answer: 'Our interactive map shows course locations with markers. You can zoom in/out to see courses in different areas, and click on markers to see course details. The map automatically updates to show courses in your current view area.',
          category: 'finding-courses',
          keywords: ['map', 'interactive', 'markers', 'zoom', 'location']
        }
      ]
    },
    {
      id: 'course-information',
      name: 'Course Information',
      description: 'Understanding the course details and data we provide.',
      icon: 'Info',
      items: [
        {
          id: 'what-makes-walkable',
          question: 'What makes a course "walkable"?',
          answer: 'A walkable course is one that\'s suitable for golfers who prefer to walk rather than ride. Factors include reasonable distances between holes, manageable terrain and hills, well-maintained walking paths, and a golf-friendly walking policy.',
          category: 'course-information',
          keywords: ['walkable', 'walking', 'terrain', 'hills', 'distance', 'policy']
        },
        {
          id: 'walkability-rating',
          question: 'How is the walkability rating calculated?',
          answer: 'Our walkability rating is based on reviews from golfers who have walked the course. It considers factors like hilliness, distance between holes, course condition, and overall walking experience. Ratings of walkable courses range from 1 (very difficult to walk) to 5 (excellent walkability).',
          category: 'course-information',
          keywords: ['walkability rating', 'reviews', 'hilliness', 'distance', 'condition', 'scale']
        },
        {
          id: 'pricing-information',
          question: 'How accurate is the pricing information?',
          answer: 'We display weekday, weekend, and twilight pricing when available. Prices are gathered from course websites and user reports, but may not reflect current rates, seasonal changes, or special offers. We recommend calling the course directly for the most up-to-date pricing.',
          category: 'course-information',
          keywords: ['pricing', 'weekday', 'weekend', 'twilight', 'accurate', 'current']
        },
        {
          id: 'facilities-info',
          question: 'What facilities information do you provide?',
          answer: 'We show whether courses have facilities like pro shops, restaurants, driving ranges, putting greens, club rentals, golf carts, push carts, and caddie services. This helps you plan your visit and know what amenities are available.',
          category: 'course-information',
          keywords: ['facilities', 'pro shop', 'restaurant', 'driving range', 'rentals', 'caddies']
        },
        {
          id: 'course-types',
          question: 'What types of courses do you feature?',
          answer: 'We feature public, private, resort, and semi-private courses across the United States. Our focus is on courses that welcome walking golfers, regardless of their ownership type. Each course listing indicates the club type and guest policy.',
          category: 'course-information',
          keywords: ['public', 'private', 'resort', 'semi-private', 'guest policy', 'types']
        }
      ]
    },
    {
      id: 'reviews-ratings',
      name: 'Reviews & Ratings',
      description: 'Everything about leaving reviews and understanding our rating system.',
      icon: 'Star',
      items: [
        {
          id: 'leave-review',
          question: 'How do I leave a review?',
          answer: 'Visit any course page and click "Write a Review." You can leave a review whether you have an account or not. For account holders, reviews are immediately associated with your profile. For non-account holders, you\'ll need to verify your email address before the review is published.',
          category: 'reviews-ratings',
          keywords: ['review', 'write', 'account', 'email', 'verification', 'publish']
        },
        {
          id: 'rating-system',
          question: 'What do the different ratings mean?',
          answer: 'Our rating system includes: Overall Rating (general experience), Walkability Rating (how suitable for walking), Course Condition (maintenance quality), Hilliness (terrain difficulty), Distance (spacing between holes), and Cost (value for money). Each is rated 1-5 stars.',
          category: 'reviews-ratings',
          keywords: ['rating system', 'overall', 'walkability', 'condition', 'hilliness', 'distance', 'cost']
        },
        {
          id: 'review-verification',
          question: 'How are reviews verified?',
          answer: 'Reviews go through a verification process to ensure authenticity. Account holders\' reviews are published immediately, while non-account reviews require email verification. We monitor for spam and inappropriate content.',
          category: 'reviews-ratings',
          keywords: ['verification', 'authenticity', 'email', 'spam', 'moderation']
        },
        {
          id: 'display-name-options',
          question: 'How is my name displayed on reviews?',
          answer: 'You can choose how your name appears on reviews: full name, first name with last initial, just initials, or remain private. This setting can be changed in your profile preferences.',
          category: 'reviews-ratings',
          keywords: ['display name', 'privacy', 'full name', 'initials', 'preferences']
        },
        {
          id: 'review-photos',
          question: 'Can I add photos to my reviews?',
          answer: 'Yes, you can upload photos with your reviews to help other golfers visualize the course. Photos should be relevant to the walking experience and follow our community guidelines.',
          category: 'reviews-ratings',
          keywords: ['photos', 'upload', 'images', 'visual', 'guidelines']
        }
      ]
    },
    {
      id: 'account-profile',
      name: 'Account & Profile',
      description: 'Managing your account, preferences, and profile settings.',
      icon: 'User',
      items: [
        {
          id: 'profile-preferences',
          question: 'What profile preferences can I set?',
          answer: 'You can set your golf experience level (beginner to professional), preferred carry method (carry bag, push cart, electric cart), handicap, home location, favorite states to golf in, and display name preferences for reviews.',
          category: 'account-profile',
          keywords: ['preferences', 'experience', 'carry method', 'handicap', 'location', 'states']
        },
        {
          id: 'email-notifications',
          question: 'Can I control email notifications?',
          answer: 'Yes, you can manage your email notification preferences in your profile settings. This includes newsletter subscriptions and other marketing communications.',
          category: 'account-profile',
          keywords: ['email', 'notifications', 'newsletter', 'marketing', 'preferences']
        },
        {
          id: 'forgot-password',
          question: 'What if I forget my password?',
          answer: 'Click "Forgot Password" on the login page, enter your email address, and you\'ll receive a password reset link. Follow the instructions in the email to create a new password.',
          category: 'account-profile',
          keywords: ['password', 'forgot', 'reset', 'email', 'login']
        },
        {
          id: 'profile-completion',
          question: 'Do I need to complete my entire profile?',
          answer: 'No, profile completion is optional but recommended. A complete profile helps us provide better course recommendations and allows other golfers to understand your experience level when reading your reviews.',
          category: 'account-profile',
          keywords: ['profile completion', 'optional', 'recommendations', 'experience level']
        }
      ]
    },
    {
      id: 'course-owners',
      name: 'For Course Owners',
      description: 'Information for golf course owners and operators.',
      icon: 'Building',
      items: [
        {
          id: 'update-course-info',
          question: 'How can I update my course information?',
          answer: 'Course owners can request updates to their course information by contacting us through our contact form. Select "Course Information" as the subject and provide the updated details. We\'ll verify and update the information promptly.',
          category: 'course-owners',
          keywords: ['update', 'course information', 'contact', 'owners', 'verify']
        },
        {
          id: 'add-new-course',
          question: 'My course isn\'t listed. How can I add it?',
          answer: 'If your course isn\'t listed and you believe it should be included in our walkable golf directory, please contact us with your course details. We\'ll review it for inclusion based on our walkability criteria.',
          category: 'course-owners',
          keywords: ['add course', 'not listed', 'inclusion', 'walkability criteria']
        },
        {
          id: 'course-photos',
          question: 'Can I provide official photos for my course?',
          answer: 'Yes, we welcome high-quality photos from course owners. Please contact us with your course photos and we\'ll consider them for inclusion in your course listing.',
          category: 'course-owners',
          keywords: ['photos', 'official', 'high-quality', 'course listing']
        },
        {
          id: 'partnership-opportunities',
          question: 'Are there partnership opportunities?',
          answer: 'We\'re always interested in partnerships with golf courses that promote walking the course. Contact us using the "Partnership Opportunity" subject in our contact form to discuss potential collaboration.',
          category: 'course-owners',
          keywords: ['partnership', 'collaboration', 'promote walking', 'opportunities']
        }
      ]
    }
  ]
}; 