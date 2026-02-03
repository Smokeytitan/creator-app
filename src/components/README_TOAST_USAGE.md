# Toast Notification System Usage Guide

The toast notification system provides a clean way to show feedback messages to users.

## Basic Usage

### 1. Import the Hook

```javascript
import { useToast } from '../contexts/ToastContext';
```

### 2. Use in Your Component

```javascript
function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      success('Data saved successfully!');
    } catch (err) {
      error('Failed to save data: ' + err.message);
    }
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

## Available Methods

### Shorthand Methods (Recommended)

```javascript
const { success, error, warning, info } = useToast();

// Success toast (green, 5s duration)
success('Operation completed!');

// Error toast (red, 7s duration)
error('Something went wrong!');

// Warning toast (yellow, 5s duration)
warning('Please review before continuing');

// Info toast (blue, 5s duration)
info('Here's some information');
```

### Custom Duration

```javascript
// Show for 3 seconds instead of default
success('Quick message', 3000);

// Show indefinitely (0 = no auto-dismiss)
error('Critical error - please refresh', 0);
```

### Advanced Usage

```javascript
const { showToast, removeToast, clearAllToasts } = useToast();

// Custom toast with full control
const toastId = showToast('Custom message', 'success', 10000);

// Manually remove a specific toast
removeToast(toastId);

// Clear all toasts at once
clearAllToasts();
```

## Toast Types

| Type | Color | Default Duration | Use Case |
|------|-------|-----------------|----------|
| `success` | Green | 5s | Successful operations, confirmations |
| `error` | Red | 7s | Errors, failures, critical issues |
| `warning` | Yellow | 5s | Warnings, cautions, things to review |
| `info` | Blue | 5s | General information, tips, updates |

## Examples

### Form Submission

```javascript
const handleSubmit = async (data) => {
  try {
    await api.submitForm(data);
    success('Form submitted successfully!');
    navigate('/dashboard');
  } catch (err) {
    if (err.status === 400) {
      warning('Please check your input and try again');
    } else {
      error('Failed to submit form. Please try again later.');
    }
  }
};
```

### Delete Confirmation

```javascript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;

  try {
    await api.deleteItem(id);
    success('Item deleted successfully');
    refetchData();
  } catch (err) {
    error('Failed to delete item: ' + err.message);
  }
};
```

### Background Task

```javascript
const handleExport = async () => {
  const toastId = info('Exporting data...', 0); // Show indefinitely

  try {
    await api.exportData();
    removeToast(toastId);
    success('Export complete! Check your downloads.');
  } catch (err) {
    removeToast(toastId);
    error('Export failed: ' + err.message);
  }
};
```

### Validation Feedback

```javascript
const handleSave = () => {
  if (!formData.name) {
    warning('Name is required');
    return;
  }

  if (!formData.email.includes('@')) {
    warning('Please enter a valid email address');
    return;
  }

  // Continue with save...
};
```

## Replacing alert() Calls

### Before (using alert)

```javascript
try {
  await api.updateCreator(data);
  alert('Creator updated successfully!');
} catch (err) {
  alert('Error: ' + err.message);
}
```

### After (using toast)

```javascript
const { success, error } = useToast();

try {
  await api.updateCreator(data);
  success('Creator updated successfully!');
} catch (err) {
  error('Failed to update creator: ' + err.message);
}
```

## Best Practices

1. **Use appropriate types**
   - `success` for completed actions
   - `error` for failures
   - `warning` for validation issues or cautions
   - `info` for neutral information

2. **Keep messages concise**
   - Good: "Post created successfully!"
   - Bad: "Your post has been created and saved to the database successfully. You can now view it in the posts list."

3. **Be specific about errors**
   - Good: "Failed to upload image: File size exceeds 5MB"
   - Bad: "An error occurred"

4. **Don't overuse toasts**
   - Don't show toasts for every single action
   - Use for important feedback that users need to see

5. **Consider duration**
   - Short messages (under 10 words): 3-5 seconds
   - Detailed messages: 5-7 seconds
   - Critical errors: 7-10 seconds or manual dismiss

## Accessibility

The toast system includes:
- ✅ `role="alert"` for screen readers
- ✅ Keyboard-accessible close buttons
- ✅ Clear visual indicators (icons + colors)
- ✅ Sufficient contrast ratios

## Styling

Toasts are styled to match the app's design system:
- Dark backgrounds with colored borders
- Icons for quick visual identification
- Smooth animations (slide in from right)
- Backdrop blur for depth

To customize styles, edit `src/contexts/ToastContext.jsx`
