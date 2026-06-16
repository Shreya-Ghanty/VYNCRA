import axiosInstance from "./axios"; // Adjust path if needed to your axios instance

/**
 * @param {string} language - programming language
 * @param {string} code - source code to be executed
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    // Send the code to your OWN Express backend
    const response = await axiosInstance.post("/sessions/execute", {
      language,
      code,
    });

    return {
      success: true,
      output: response.data.output || "No output",
    };
  } catch (error) {
    return {
      success: false,
      // Safely grab the error message your backend returns
      error: error.response?.data?.error || `Failed to execute code: ${error.message}`,
    };
  }
}

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
  };

  return extensions[language] || "txt";
}
