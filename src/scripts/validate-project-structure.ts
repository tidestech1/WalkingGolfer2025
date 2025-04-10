import { stat } from 'fs/promises';
import path from 'path';

interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

const EXPECTED_DIRECTORIES = {
  'src/app/components': 'React components',
  'src/app/api': 'API routes',
  'src/lib': 'Utility functions and shared code',
  'src/types': 'TypeScript type definitions',
  'src/scripts': 'Utility scripts'
};

async function validateProjectStructure(): Promise<ValidationResult> {
  const issues: string[] = [];
  const srcPath = path.join(process.cwd(), 'src');

  // Check for unexpected components directory
  try {
    const componentsPath = path.join(srcPath, 'components');
    await stat(componentsPath);
    issues.push('❌ Found unexpected /src/components directory. Components should be in /src/app/components');
  } catch {
    // Expected - directory should not exist
  }

  // Check each expected directory
  for (const [dir, description] of Object.entries(EXPECTED_DIRECTORIES)) {
    try {
      const fullPath = path.join(srcPath, dir);
      await stat(fullPath);
      console.log(`✅ Found ${dir} (${description})`);
    } catch {
      issues.push(`❌ Missing ${dir} (${description})`);
    }
  }

  // Check for .env files
  try {
    const envPath = path.join(process.cwd(), '.env');
    await stat(envPath);
    issues.push('❌ Found .env file. Environment variables should be stored in Replit Secrets');
  } catch {
    // Expected - .env should not exist
  }

  // Print results
  console.log('\n=== Project Structure Validation ===');
  if (issues.length === 0) {
    console.log('✅ All project structure requirements met!');
  } else {
    console.log('❌ Found issues:');
    issues.forEach(issue => console.log(issue));
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Run validation
validateProjectStructure().catch(error => {
  console.error('Error validating project structure:', error);
  process.exit(1);
}); 