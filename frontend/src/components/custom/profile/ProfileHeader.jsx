import React from "react";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button2";
import { Badge } from "../../ui/badge";
import { Camera, Mail, MapPin, Calendar } from "lucide-react";

const ProfileHeader = ({
  name,
  role,
  department,
  email,
  location,
  joinedDate,
  avatarUrl,
  onAvatarChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="relative">
        <Avatar
          src={avatarUrl}
          fallback={name}
          size="xl"
          className="border-2 border-white shadow-md"
        />
      </div>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
        </div>

        {role && (
          <p className="text-sm font-medium text-gray-500 mt-1 capitalize">
            {role}
          </p>
        )}

        <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Mail size={14} className="mr-1.5" />
            <span>{email}</span>
          </div>

          {location && (
            <div className="flex items-center">
              <MapPin size={14} className="mr-1.5" />
              <span>{location}</span>
            </div>
          )}

          <div className="flex items-center">
            <Calendar size={14} className="mr-1.5" />
            <span>Joined {joinedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
