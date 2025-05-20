import React from "react";
import { Tabs, TabList, TabTrigger, TabContent } from "../components/ui/Tabs";
import PageHeader from "./PageHeader";
import Button from "../components/ui/Button2";
import { Pencil } from "lucide-react";

const ProfileLayout = ({ children }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl  px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Your Profile"
          description="View and edit your personal information"
          actions={
            <Button variant="outline" leftIcon={<Pencil size={16} />}>
              Edit Profile
            </Button>
          }
        />

        <div className="mt-6">
          <Tabs defaultValue="personal-info">
            <TabList className="bg-white rounded-t-lg shadow-sm px-4">
              <TabTrigger value="personal-info">Personal Info</TabTrigger>
              <TabTrigger value="security">Security</TabTrigger>
              <TabTrigger value="activity">Activity</TabTrigger>
            </TabList>

            <div className="bg-white rounded-b-lg shadow-sm p-6">
              {children}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
