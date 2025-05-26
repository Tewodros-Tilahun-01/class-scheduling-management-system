import NotificationHeader from "../components/custom/notification/NotificationHeader";
import NotificationList from "../components/custom/notification/NotificationList";
import DashboardLayout from "@/layouts/DashboardLayout";

const NotificationPage = () => {
  return (
    <DashboardLayout>
      <div className="h-screen p-0">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200 bg-white px-6 py-5">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              Notifications Center
            </h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Stay informed about important updates, messages, and system
              notifications
            </p>
          </div>
          <NotificationHeader />
          <div className="overflow-y-auto h-[calc(100vh-240px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <NotificationList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationPage;
