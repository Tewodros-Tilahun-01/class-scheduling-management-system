import { useAuth } from "@/context/AuthContext";
import { generateLoginTokenForReps } from "@/services/UserService";
import React, { useEffect, useState } from "react";
import ErrorMessage from "../ui/auth/ErrorMessage";
import Button from "../ui/Button2";

const CopyInstallCommand = ({ repId, setModalClose }) => {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const generateLinkForReps = async () => {
      generateLoginTokenForReps(repId)
        .then((res) => {
          setToken(res.token);
        })
        .catch((err) => {
          setError(err.response.data.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    generateLinkForReps();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md space-y-3 shadow-lg">
        <h3 className="text-lg font-medium">Generated key</h3>
        <div className="relative">
          {/* {error && <ErrorMessage message={error} />} */}

          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                />
              </svg>
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <>
              <label htmlFor="npm-install-copy-text" className="sr-only">
                Copy
              </label>
              <input
                id="npm-install-copy-text"
                type="text"
                className="col-span-6 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={token}
                disabled
                readOnly
              />
              <button
                onClick={handleCopy}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg py-2 px-2.5 inline-flex items-center justify-center bg-white border-gray-200 border h-8"
              >
                {!copied ? (
                  <span className="inline-flex items-center">
                    <svg
                      className="w-3 h-3 me-1.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 18 20"
                    >
                      <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z" />
                    </svg>
                    <span className="text-xs font-semibold">Copy</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <svg
                      className="w-3 h-3 text-green-700 dark:text-green-700 me-1.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 16 12"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 5.917 5.724 10.5 15 1.5"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-green-700 dark:text-green-500">
                      Copied
                    </span>
                  </span>
                )}
              </button>
            </>
          )}
        </div>
        <div className="w-full  flex justify-end">
          <Button onClick={() => setModalClose(false)}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default CopyInstallCommand;
