// ============================================
// Email Notification Service
// Uses EmailJS for sending real emails from frontend
// ============================================

import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Free tier: 200 emails/month
// Setup at: https://www.emailjs.com/

// These are PUBLIC keys - safe to use in frontend
const EMAILJS_SERVICE_ID = 'service_bugtracker';
const EMAILJS_TEMPLATE_ID = 'template_bug_notify';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // User will add their own key

// Check if EmailJS is configured
export const isEmailConfigured = (): boolean => {
  return EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
};

// Initialize EmailJS
export const initEmailService = () => {
  if (isEmailConfigured()) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ Email service initialized');
  } else {
    console.log('⚠️ Email service not configured. Add your EmailJS public key to enable notifications.');
  }
};

// Email template parameters interface
interface BugNotificationParams {
  to_email: string;
  to_name: string;
  from_name: string;
  bug_title: string;
  bug_description: string;
  bug_priority: string;
  bug_status: string;
  action_type: 'assigned' | 'status_changed' | 'created' | 'commented';
  app_url?: string;
}

// Send bug notification email
export const sendBugNotification = async (params: BugNotificationParams): Promise<boolean> => {
  // If not configured, simulate email (for demo purposes)
  if (!isEmailConfigured()) {
    console.log('📧 Email Notification (Simulated):');
    console.log(`   To: ${params.to_email}`);
    console.log(`   Subject: Bug ${params.action_type}: ${params.bug_title}`);
    console.log(`   Message: ${getEmailMessage(params)}`);
    
    // Show browser notification instead
    showBrowserNotification(params);
    
    return true;
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: params.to_email,
        to_name: params.to_name,
        from_name: params.from_name,
        bug_title: params.bug_title,
        bug_description: params.bug_description.substring(0, 200) + '...',
        bug_priority: params.bug_priority.toUpperCase(),
        bug_status: params.bug_status.replace('_', ' ').toUpperCase(),
        action_type: params.action_type,
        message: getEmailMessage(params),
        app_url: window.location.origin,
      },
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('❌ Email failed:', error);
    return false;
  }
};

// Generate email message based on action type
const getEmailMessage = (params: BugNotificationParams): string => {
  switch (params.action_type) {
    case 'assigned':
      return `A new bug has been assigned to you by ${params.from_name}.\n\nBug: ${params.bug_title}\nPriority: ${params.bug_priority}\n\nDescription:\n${params.bug_description}`;
    case 'status_changed':
      return `Bug status has been updated to "${params.bug_status}".\n\nBug: ${params.bug_title}`;
    case 'created':
      return `A new bug has been reported.\n\nBug: ${params.bug_title}\nPriority: ${params.bug_priority}\n\nDescription:\n${params.bug_description}`;
    default:
      return `Bug update: ${params.bug_title}`;
  }
};

// Browser notification as fallback
const showBrowserNotification = (params: BugNotificationParams) => {
  // Request permission if not granted
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(`Bug ${params.action_type}: ${params.bug_title}`, {
        body: `Priority: ${params.bug_priority.toUpperCase()}\nAssigned to: ${params.to_name}`,
        icon: '🐛',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`Bug ${params.action_type}: ${params.bug_title}`, {
            body: `Priority: ${params.bug_priority.toUpperCase()}`,
            icon: '🐛',
          });
        }
      });
    }
  }
};

// Notify developer when bug is assigned
export const notifyBugAssigned = async (
  developerEmail: string,
  developerName: string,
  assignedBy: string,
  bugTitle: string,
  bugDescription: string,
  bugPriority: string
): Promise<boolean> => {
  return sendBugNotification({
    to_email: developerEmail,
    to_name: developerName,
    from_name: assignedBy,
    bug_title: bugTitle,
    bug_description: bugDescription,
    bug_priority: bugPriority,
    bug_status: 'open',
    action_type: 'assigned',
  });
};

// Notify tester when bug status changes
export const notifyStatusChanged = async (
  testerEmail: string,
  testerName: string,
  changedBy: string,
  bugTitle: string,
  bugDescription: string,
  bugPriority: string,
  newStatus: string
): Promise<boolean> => {
  return sendBugNotification({
    to_email: testerEmail,
    to_name: testerName,
    from_name: changedBy,
    bug_title: bugTitle,
    bug_description: bugDescription,
    bug_priority: bugPriority,
    bug_status: newStatus,
    action_type: 'status_changed',
  });
};

// Notify admin when new bug is created
export const notifyBugCreated = async (
  adminEmail: string,
  adminName: string,
  createdBy: string,
  bugTitle: string,
  bugDescription: string,
  bugPriority: string
): Promise<boolean> => {
  return sendBugNotification({
    to_email: adminEmail,
    to_name: adminName,
    from_name: createdBy,
    bug_title: bugTitle,
    bug_description: bugDescription,
    bug_priority: bugPriority,
    bug_status: 'open',
    action_type: 'created',
  });
};
