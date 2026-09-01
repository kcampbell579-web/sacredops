import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#3f2c39]">How Village works</h1>
        <p className="mt-2 text-[#6b4b5f]">A simple, friendly way for moms to help each other out.</p>
      </div>

      <ol className="space-y-4">
        {[
          ["📝", "Post what you need", "Describe the task, when you need it, and what you'll pay. It's free to post."],
          ["🙋‍♀️", "A mom claims it", "Another mom nearby offers to help. Once she claims it, you both get each other's contact info."],
          ["🤝", "Sort out the details", "Message or call to agree on timing and specifics — meet in a public place when you can."],
          ["💛", "Help & settle up", "She lends a hand, you pay her (cash or your favorite app), and you mark the task complete."],
        ].map(([emoji, title, body]) => (
          <li key={title} className="card flex gap-4">
            <span className="text-3xl">{emoji}</span>
            <div>
              <h3 className="font-bold text-[#3f2c39]">{title}</h3>
              <p className="mt-1 text-sm text-[#6b4b5f]">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
        <h3 className="font-bold">A few safety notes 💡</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Trust your gut. You never have to accept or claim a task.</li>
          <li>Meet in public and bring a friend when it makes sense.</li>
          <li>Agree on pay and details up front to avoid surprises.</li>
          <li>For childcare, share references and start small.</li>
        </ul>
      </div>

      <div className="text-center">
        <Link href="/signup" className="btn-primary">
          Join the village
        </Link>
      </div>
    </div>
  );
}
