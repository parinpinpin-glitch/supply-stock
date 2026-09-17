export default function NoAccess() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 text-center">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-2 text-sm text-gray-600">หน้านี้สำหรับ Admin เท่านั้น</p>
        <a href="/dashboard" className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
          กลับ Dashboard
        </a>
      </div>
    </main>
  );
}
