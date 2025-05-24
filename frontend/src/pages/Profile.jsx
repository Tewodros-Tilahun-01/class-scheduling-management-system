import React, { useEffect, useState } from "react";
import { TabContent } from "../components/ui/Tabs";
import ProfileLayout from "../layouts/ProfileLayout";
import ProfileHeader from "../components/custom/profile/ProfileHeader";
import UserInfoSection from "../components/custom/profile/UserInfoSection";
import ActivitySection from "../components/custom/profile/ActiveSection";
import SecuritySection from "../components/custom/profile/SecuritySection";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  getPersonalInfo,
  updatePersonalInfo,
  updateUser,
} from "@/services/UserService";
import { useAuth } from "@/context/AuthContext";
import NotificationsSection from "@/components/custom/profile/NotificationSection";

const ProfilePage = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState({
    contact_info: {
      email: "",
      tel: "",
      address: "",
    },
    personal_info: {
      birth_date: "",
      languages: [],
      bio: "",
    },
    professional_info: {
      position: "",
      education: "",
    },
    user: "",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const fetchPersonalInfos = async () => {
      setLoading(true);
      try {
        const res = await getPersonalInfo(user.id);
        console.log("from api service", res);
        setInfo({
          contact_info: res.contact_info ? res.contact_info : info.contact_info,
          personal_info: res.personal_info
            ? res.personal_info
            : info.personal_info,
          professional_info: res.professional_info
            ? res.professional_info
            : info.professional_info,
          user: res.user,
        });
      } catch (error) {
        setErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonalInfos();
  }, []);
  if (loading) {
    return <div className="">Loading</div>;
  }
  console.log(info, user.id);
  const userProfile = {
    name: "Yoseph Alemu",
    role: "Admin",
    department: "Computer Science",
    email: "yoseph.alemu@example.com",
    location: "New York, NY",
    joinedDate: "March 2023",
    avatarUrl:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  };

  const contactInfo = info.contact_info;
  const personalInfo = info.personal_info;

  const professionalInfo = info.professional_info;
  const userInfo = info.user;

  const recentActivities = [
    {
      id: "1",
      type: "login",
      title: "Account Login",
      description: "You logged in from a new device",
      timestamp: "2 hours ago",
      status: "success",
    },
    {
      id: "2",
      type: "update",
      title: "Profile Updated",
      description: "You updated your profile information",
      timestamp: "Yesterday",
    },
    {
      id: "3",
      type: "class",
      title: "Class Representative Added",
      description: "Added John Doe as Class Representative for CS101",
      timestamp: "3 days ago",
    },
    {
      id: "4",
      type: "meeting",
      title: "Department Meeting",
      description: "Scheduled a department meeting for next Monday",
      timestamp: "Last week",
    },
    {
      id: "5",
      type: "report",
      title: "Attendance Report Generated",
      description: "Generated monthly attendance report for all classes",
      timestamp: "2 weeks ago",
    },
  ];
  const hanldeEditSubmit = async (section, value) => {
    const updatedInfo = {
      ...info,
      [section]: value,
    };

    updatePersonalInfo(user.id, updatedInfo)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleAvatarChange = () => {
    console.log("Changing avatar");
  };

  const handleInputChange = (section, value) => {
    setInfo((prev) => ({
      ...prev,
      [section]: value,
    }));
    console.log("Updated info:", section, value);
  };
  console.log("info", info.name);

  return (
    <DashboardLayout>
      <ProfileLayout>
        <ProfileHeader
          name={userInfo.name}
          role={userInfo.role}
          department={userProfile.department}
          email={contactInfo.email}
          location={contactInfo.address}
          joinedDate={userInfo.createdAt}
          avatarUrl={userProfile.avatarUrl}
          onAvatarChange={handleAvatarChange}
        />

        <div className="mt-8">
          <TabContent value="personal-info">
            <UserInfoSection
              contactInfo={contactInfo}
              personalInfo={personalInfo}
              professionalInfo={professionalInfo}
              userInfo={userInfo}
              setInfo={handleInputChange}
              info={info}
              hanldeEditSubmit={hanldeEditSubmit}
            />
          </TabContent>

          <TabContent value="security">
            <SecuritySection />
          </TabContent>

          <TabContent value="notification">
            {/* <ActivitySection activities={recentActivities} /> */}
            <NotificationsSection />
          </TabContent>
        </div>
      </ProfileLayout>
    </DashboardLayout>
  );
};

export default ProfilePage;
