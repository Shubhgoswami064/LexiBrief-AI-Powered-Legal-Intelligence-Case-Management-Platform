import { redirect } from "next/navigation";
import { auth } from "../../auth";
import Sidebar from "../components/Sidebar";
import UploadForm from "../components/UploadForm";

const ROLE_LABEL = {
  LAWYER: "Lawyer",
  OFFICIAL: "Court official",
  ADMIN: "Administrator",
};

export default async function UploadPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar
        name={session.user.name || session.user.email}
        roleLabel={ROLE_LABEL[session.user.role] || "Lawyer"}
      />
      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <h1 className="font-serif text-3xl">Upload a judgment</h1>
        <p className="mt-2 max-w-xl text-muted">
          Add a PDF of the judgment. We read its text so it can be summarized and searched.
        </p>
        <div className="mt-8 max-w-2xl">
          <UploadForm />
        </div>
      </main>
    </div>
  );
}