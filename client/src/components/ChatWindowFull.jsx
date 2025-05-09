import ChatLayout from "./ChatLayout";

export default function ChatWindowFull({ user }) {
  return (
    <div className="h-full w-full border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
      <ChatLayout initialUser={user} />
    </div>
  );
}
