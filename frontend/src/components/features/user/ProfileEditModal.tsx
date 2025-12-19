import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  UserCircleIcon, 
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useProfile } from '@/hooks/useProfile';
import { AvatarUpload } from './AvatarUpload';
import type { UpdateProfileDto, ChangePasswordDto } from '@/types/user.types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const {
    profile,
    isLoading,
    error,
    successMessage,
    updateProfile,
    changePassword,
    clearError,
    clearSuccess,
  } = useProfile();

  // Profile form state
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({
    name: '',
    bio: '',
    email: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordDto>({
    currentPassword: '',
    newPassword: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  // Initialize form with profile data when modal opens
  useEffect(() => {
    if (profile && isOpen) {
      setProfileForm({
        name: profile.name,
        bio: profile.bio || '',
        email: profile.email,
      });
    }
  }, [profile, isOpen]);

  // Clear messages on tab change
  const handleTabChange = () => {
    clearError();
    clearSuccess();
    setValidationError('');
  };

  // Handle profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!profileForm.name || profileForm.name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters');
      return;
    }

    if (profileForm.bio && profileForm.bio.length > 500) {
      setValidationError('Bio must not exceed 500 characters');
      return;
    }

    const success = await updateProfile(profileForm);
    if (success) {
      setTimeout(() => {
        clearSuccess();
        onClose();
      }, 2000);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!passwordForm.currentPassword) {
      setValidationError('Current password is required');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      setValidationError('Password must contain uppercase, lowercase, and number');
      return;
    }

    if (passwordForm.newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const success = await changePassword(passwordForm);
    if (success) {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
      setTimeout(() => {
        clearSuccess();
      }, 3000);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit Profile
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Tabs */}
                <Tab.Group onChange={handleTabChange}>
                  <Tab.List className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                    <Tab as={Fragment}>
                      {({ selected }: { selected: boolean }) => (
                        <button
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            selected
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <UserCircleIcon className="h-5 w-5" />
                          Profile Information
                        </button>
                      )}
                    </Tab>
                    <Tab as={Fragment}>
                      {({ selected }: { selected: boolean }) => (
                        <button
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            selected
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <KeyIcon className="h-5 w-5" />
                          Change Password
                        </button>
                      )}
                    </Tab>
                  </Tab.List>

                  <Tab.Panels className="px-6 py-6">
                    {/* Profile Tab */}
                    <Tab.Panel>
                      <form onSubmit={handleProfileSubmit} className="space-y-6">
                        {/* Avatar Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Profile Picture
                          </label>
                          <AvatarUpload currentAvatarUrl={profile?.avatarUrl} />
                        </div>

                        {/* Name */}
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name *
                          </label>
                          <input
                            id="name"
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter your full name"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address *
                          </label>
                          <input
                            id="email"
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="your@email.com"
                          />
                        </div>

                        {/* Bio */}
                        <div>
                          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bio
                          </label>
                          <textarea
                            id="bio"
                            rows={4}
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                            placeholder="Tell us about yourself..."
                            maxLength={500}
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                            {profileForm.bio?.length || 0}/500
                          </p>
                        </div>

                        {/* Messages */}
                        {(error || validationError || successMessage) && (
                          <div
                            className={`flex items-start gap-3 p-4 rounded-lg ${
                              error || validationError
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            }`}
                          >
                            {error || validationError ? (
                              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm">{error || validationError || successMessage}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </Tab.Panel>

                    {/* Password Tab */}
                    <Tab.Panel>
                      <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        {/* Current Password */}
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password *
                          </label>
                          <input
                            id="currentPassword"
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter current password"
                          />
                        </div>

                        {/* New Password */}
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password *
                          </label>
                          <input
                            id="newPassword"
                            type="password"
                            required
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter new password"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Min 8 characters with uppercase, lowercase, and number
                          </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password *
                          </label>
                          <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Confirm new password"
                          />
                        </div>

                        {/* Messages */}
                        {(error || validationError || successMessage) && (
                          <div
                            className={`flex items-start gap-3 p-4 rounded-lg ${
                              error || validationError
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            }`}
                          >
                            {error || validationError ? (
                              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm">{error || validationError || successMessage}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? 'Changing...' : 'Change Password'}
                          </button>
                        </div>
                      </form>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
