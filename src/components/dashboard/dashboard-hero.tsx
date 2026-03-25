import Image from "next/image";

export function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-l from-card to-secondary">
      <div className="absolute inset-0">
        <Image
          src="/images/master-standing.png"
          alt="Karate Master"
          fill
          className="object-cover object-top opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-card/50 to-card" />
      </div>

      <div className="relative z-10 p-8">
        <h2 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          שלום אביטן, ברוך הבא ל-Avitan Dojo
        </h2>
        <p className="mt-2 max-w-lg text-muted-foreground">
          ניהול תלמידים, קבוצות, תשלומים ותזכורות במקום אחד. עקוב אחר הפעילות
          היומית של המכון בצורה פשוטה ויעילה.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">
            המערכת פעילה ומעודכנת
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-l from-dojo-red via-dojo-gold to-transparent" />
    </div>
  );
}
