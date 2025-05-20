import React from "react";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button2";
import Badge from "../../ui/Badge";
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
        <button
          onClick={onAvatarChange}
          className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
          aria-label="Change profile picture"
        >
          <Camera size={14} className="text-gray-700" />
        </button>
      </div>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          <Badge variant="secondary" className="w-fit">
            {role}
          </Badge>
        </div>

        {department && (
          <p className="text-sm font-medium text-gray-500 mt-1">{department}</p>
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

      <div className="sm:self-start">
        <Button size="sm" variant="outline">
          View public profile
        </Button>
      </div>
    </div>
  );
};

export default ProfileHeader;
