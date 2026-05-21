import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MentionInput Component
 * 
 * A rich text input component that supports @mentions with autocomplete.
 * 
 * @param {string} value - Current input value
 * @param {function} onChange - Callback when value changes
 * @param {function} onSearch - Callback to search users (receives query string)
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes
 * @param {boolean} multiline - Whether to use textarea (default: false)
 * @param {number} rows - Number of rows for textarea (default: 3)
 */
const MentionInput = ({ 
  value = '', 
  onChange, 
  onSearch, 
  placeholder = 'Type @ to mention someone...', 
  className = '',
  multiline = false,
  rows = 3
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Detect @ symbol and trigger search
  useEffect(() => {
    const text = value || '';
    const cursorPos = inputRef.current?.selectionStart || 0;
    
    // Find @ symbol before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(' ') && textAfterAt.length < 50) {
        setMentionQuery(textAfterAt);
        setCursorPosition(lastAtIndex);
        
        // Trigger search if query is at least 1 character
        if (textAfterAt.length >= 1 && onSearch) {
          onSearch(textAfterAt).then(results => {
            setSuggestions(results || []);
            setShowSuggestions(results && results.length > 0);
            setSelectedIndex(0);
          });
        } else if (textAfterAt.length === 0) {
          setShowSuggestions(false);
          setSuggestions([]);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      selectMention(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Insert mention into text
  const selectMention = (user) => {
    if (!user) return;

    const text = value || '';
    const beforeMention = text.substring(0, cursorPosition);
    const afterMention = text.substring(inputRef.current?.selectionStart || 0);
    
    // Format: @[Display Name](userId)
    const mentionText = `@[${user.fullName}](${user._id})`;
    const newText = beforeMention + mentionText + ' ' + afterMention;
    
    onChange(newText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Set cursor position after mention
    setTimeout(() => {
      const newCursorPos = beforeMention.length + mentionText.length + 1;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      inputRef.current?.focus();
    }, 0);
  };

  // Render text with highlighted mentions
  const renderPreview = () => {
    if (!value) return null;
    
    const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(value.substring(lastIndex, match.index));
      }
      
      // Add mention
      parts.push(
        <span key={match.index} className="text-blue-600 font-semibold">
          @{match[1]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(value.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : value;
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="relative w-full">
      <InputComponent
        ref={inputRef}
        type={multiline ? undefined : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
      />

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-[9999] w-full bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {suggestions.map((user, index) => (
              <div
                key={user._id}
                onClick={() => selectMention(user)}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                  index === selectedIndex
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentionInput;
