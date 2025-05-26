import React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import PageHeader from "@/layouts/PageHeader";

const ProfileLayout = ({ children }) => {
  return (
    <div className="bg-gray-50 min-h-screen w-full ">
      <div className="max-w-5xl  px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Your Profile"
          description="View and edit your personal information"
        />

        <div className="mt-6">
          <Tabs defaultValue="personal-info">
            <TabsList className="bg-white rounded-t-lg shadow-sm px-4">
              <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

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
