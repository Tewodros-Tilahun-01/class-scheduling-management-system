import React, { useEffect, useState } from "react";
import { TabsContent } from "../components/ui/tabs";
import ProfileLayout from "../layouts/ProfileLayout";
import ProfileHeader from "../components/custom/profile/ProfileHeader";
import UserInfoSection from "../components/custom/profile/UserInfoSection";
import SecuritySection from "../components/custom/profile/SecuritySection";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getPersonalInfo, updatePersonalInfo } from "@/services/UserService";
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
          <TabsContent value="personal-info">
            <UserInfoSection
              contactInfo={contactInfo}
              personalInfo={personalInfo}
              professionalInfo={professionalInfo}
              userInfo={userInfo}
              setInfo={handleInputChange}
              info={info}
              hanldeEditSubmit={hanldeEditSubmit}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySection />
          </TabsContent>
        </div>
      </ProfileLayout>
    </DashboardLayout>
  );
};

export default ProfilePage;
