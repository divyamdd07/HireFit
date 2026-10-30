import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Client ID set nahi hai to button aur "or" divider dono chhup jate hain
export const googleEnabled = Boolean(CLIENT_ID);

export default function GoogleButton({ onCredential, onError, text = "continue_with" }) {
  if (!googleEnabled) return null;

  // Google button ki width pixels mein leta hai (200-400). Chhote phone pe fit karne ke liye
  const width = Math.max(200, Math.min(340, window.innerWidth - 96));

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(response) => onCredential(response.credential)}
          onError={() => onError("Google sign-in failed. Please try again.")}
          theme="filled_black"
          shape="pill"
          text={text}
          width={String(width)}
        />
      </div>
    </GoogleOAuthProvider>
  );
}