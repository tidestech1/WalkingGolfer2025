interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ 
  text = "Loading...", 
  size = 'md',
  className = '' 
}: LoadingSpinnerProps): JSX.Element {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const spinnerOnly = !text || text === '';

  if (spinnerOnly) {
    return (
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`}></div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      <span className="ml-2 text-gray-600">{text}</span>
    </div>
  );
} 