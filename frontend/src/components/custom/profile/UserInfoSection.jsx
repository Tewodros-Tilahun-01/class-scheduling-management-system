import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/Card2";
import Button from "../../ui/Button2";
import Input from "../../ui/Input2";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building,
  Calendar,
  Languages,
} from "lucide-react";

const UserInfoSection = ({
  contactInfo,
  personalInfo,
  professionalInfo,
  userInfo,
  setInfo,
  hanldeEditSubmit,
}) => {
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] =
    React.useState(false);

  const [edited, setEdited] = useState({
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

  const actions = {
    personal_info: setIsEditingPersonal,
    contact_info: setIsEditingContact,
    professional_info: setIsEditingProfessional,
  };

  const handleEdit = async (action) => {
    hanldeEditSubmit()
      .then(() => {})
      .finally(() => {
        (actions[action] || setIsEditingProfessional)(false);
      });
  };
  const handleFormClose = (action) => {
    setEdited({
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
    });
    (actions[action] || setIsEditingProfessional)(false);
  };
  const handleSubmit = async (action) => {
    if (
      Object.values(edited[action]).some(
        (value) => value === "" || (Array.isArray(value) && value.length === 0)
      )
    ) {
      console.log("Please fill all fields");
      return;
    }
    setIsLoading(true);

    console.log("action", action, edited[action]);
    setInfo(action, edited[action]);
    hanldeEditSubmit()
      .then(() => {
        setEdited({
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
      })
      .catch((error) => {
        console.error("Error updating information:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });

    (actions[action] || setIsEditingProfessional)(false);
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 px-6">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Contact Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingContact(!isEditingContact)}
          >
            {isEditingContact ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {isEditingContact ? (
            <form className="space-y-4">
              <Input
                label="Email"
                defaultValue={contactInfo.email}
                leftIcon={<Mail size={16} />}
                type="email"
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    contact_info: {
                      ...edited.contact_info,
                      email: e.target.value,
                    },
                  })
                }
              />
              <Input
                label="Phone Number"
                defaultValue={contactInfo.tel}
                leftIcon={<Phone size={16} />}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    contact_info: {
                      ...edited.contact_info,
                      tel: e.target.value,
                    },
                  })
                }
              />
              <Input
                label="Address"
                defaultValue={contactInfo.address}
                leftIcon={<MapPin size={16} />}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    contact_info: {
                      ...edited.contact_info,
                      address: e.target.value,
                    },
                  })
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormClose("contact_info")}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleSubmit("contact_info")}>
                  {isLoading ? (
                    <span className="animate-spin">
                      <svg
                        className="w-4 h-4 mr-3 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <Mail size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">
                    {contactInfo.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <Phone size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Phone</div>
                  <div className="text-sm text-gray-600">{contactInfo.tel}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <MapPin size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Address
                  </div>
                  <div className="text-sm text-gray-600">
                    {contactInfo.address}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 px-6">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Personal Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingPersonal(!isEditingPersonal)}
          >
            {isEditingPersonal ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {isEditingPersonal ? (
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  defaultValue={personalInfo.firstName}
                  leftIcon={<User size={16} />}
                  onChange={(e) =>
                    setEdited({
                      ...edited,
                      personal_info: {
                        ...edited.personal_info,
                        firstName: e.target.value,
                      },
                    })
                  }
                />
                <Input
                  label="Last Name"
                  defaultValue={personalInfo.lastName}
                  leftIcon={<User size={16} />}
                />
              </div>
              <Input
                label="Bio"
                defaultValue={personalInfo.bio}
                as="textarea"
                rows={3}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    personal_info: {
                      ...edited.personal_info,
                      bio: e.target.value,
                    },
                  })
                }
              />
              <Input
                label="Languages"
                defaultValue={personalInfo.bio}
                as="textarea"
                leftIcon={<Languages size={16} />}
                rows={3}
                onChange={(e) => {
                  setEdited({
                    ...edited,
                    personal_info: {
                      ...edited.personal_info,
                      languages: e.target.value.split(","),
                    },
                  });
                }}
              />
              <Input
                label="Birth Date"
                defaultValue={personalInfo.birth_date}
                leftIcon={<Calendar size={16} />}
                type="date"
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    personal_info: {
                      ...edited.personal_info,
                      birth_date: e.target.value,
                    },
                  })
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormClose("personal_info")}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleSubmit("personal_info")}>
                  {isLoading ? (
                    <span className="animate-spin">
                      <svg
                        className="w-4 h-4 mr-3 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <User size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Full Name
                  </div>
                  <div className="text-sm text-gray-600">
                    {personalInfo.firstName} {personalInfo.lastName}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <Calendar size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Birth Date
                  </div>
                  <div className="text-sm text-gray-600">
                    {personalInfo.birth_date}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <Languages size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Languages
                  </div>
                  <div className="text-sm text-gray-600">
                    {personalInfo.languages.join(", ")}
                  </div>
                </div>
              </div>
              {personalInfo.bio && (
                <div className="p-3 rounded-lg bg-white border border-gray-100">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Bio
                  </div>
                  <div className="text-sm text-gray-600">
                    {personalInfo.bio}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 px-6">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Professional Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingProfessional(!isEditingProfessional)}
          >
            {isEditingProfessional ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {isEditingProfessional ? (
            <form className="space-y-4">
              <Input
                label="Department"
                defaultValue={professionalInfo.department}
                leftIcon={<Building size={16} />}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    professional_info: {
                      ...edited.professional_info,
                      department: e.target.value,
                    },
                  })
                }
              />
              <Input
                label="Position"
                defaultValue={professionalInfo.position}
                leftIcon={<User size={16} />}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    professional_info: {
                      ...edited.professional_info,
                      position: e.target.value,
                    },
                  })
                }
              />

              <Input
                label="Education"
                defaultValue={professionalInfo.education}
                leftIcon={<GraduationCap size={16} />}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    professional_info: {
                      ...edited.professional_info,
                      education: e.target.value,
                    },
                  })
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormClose("professional_info")}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmit("professional_info")}
                >
                  {isLoading ? (
                    <span className="animate-spin">
                      <svg
                        className="w-4 h-4 mr-3 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <Building size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Department
                  </div>
                  <div className="text-sm text-gray-600">
                    {professionalInfo.department}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <User size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Position
                  </div>
                  <div className="text-sm text-gray-600">
                    {professionalInfo.position}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <Calendar size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Join Date
                  </div>
                  <div className="text-sm text-gray-600">
                    {userInfo.createdAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-white border border-gray-100">
                <GraduationCap size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Education
                  </div>
                  <div className="text-sm text-gray-600">
                    {professionalInfo.education}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInfoSection;
