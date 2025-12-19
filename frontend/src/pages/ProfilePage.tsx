import { memo, useState } from 'react';
import { 
  PencilIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { MainLayout } from '../components/layout/MainLayout';
import { ProfileEditModal } from '../components/features/user';
import { useProfile } from '../hooks/useProfile';
import { formatTimestamp } from '../utils/formatters';

export const ProfilePage = memo(function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Profile not found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Unable to load profile information
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Avatar & Actions */}
            <div className="flex items-end justify-between -mt-16 mb-6">
              {/* Avatar */}
              <div className="relative">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                    <span className="text-4xl font-bold text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Profile
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.name}
                </h1>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">User ID</dt>
              <dd className="text-sm font-mono text-gray-900 dark:text-white">
                {profile.id}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {formatTimestamp(new Date(profile.updatedAt))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </MainLayout>
  );
});
