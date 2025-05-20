import React from "react";
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
  info,
}) => {
  const [isEditingContact, setIsEditingContact] = React.useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = React.useState(false);
  const [isEditingProfessional, setIsEditingProfessional] =
    React.useState(false);

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
                  setInfo("contact_info", "email", e.target.value)
                }
              />
              <Input
                label="Phone Number"
                defaultValue={contactInfo.tel}
                leftIcon={<Phone size={16} />}
                onChange={(e) => setInfo("contact_info", "tel", e.target.value)}
              />
              <Input
                label="Address"
                defaultValue={contactInfo.address}
                leftIcon={<MapPin size={16} />}
                onChange={(e) =>
                  setInfo("contact_info", "address", e.target.value)
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingContact(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setIsEditingContact(false)}>
                  Save Changes
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
                    setInfo("personal_info", "name", e.target.value)
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
                  setInfo("personal_info", "bio", e, target.value)
                }
              />
              <Input
                label="Birth Date"
                defaultValue={personalInfo.birth_date}
                leftIcon={<Calendar size={16} />}
                type="date"
                onChange={(e) =>
                  setInfo("personal_info", "birth_date", e.target.value)
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingPersonal(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setIsEditingPersonal(false)}>
                  Save Changes
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
                  setInfo("personal_info", "birth_date", e.target.value)
                }
              />
              <Input
                label="Position"
                defaultValue={professionalInfo.position}
                leftIcon={<User size={16} />}
                onChange={(e) =>
                  setInfo("professional_info", "position", e.target.value)
                }
              />
              <Input
                label="Employee ID"
                defaultValue={professionalInfo.employeeId}
                leftIcon={<User size={16} />}
              />
              <Input
                label="Education"
                defaultValue={professionalInfo.education}
                leftIcon={<GraduationCap size={16} />}
                onChange={(e) =>
                  setInfo("professional_info", "education", e.target.value)
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfessional(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditingProfessional(false)}
                >
                  Save Changes
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
