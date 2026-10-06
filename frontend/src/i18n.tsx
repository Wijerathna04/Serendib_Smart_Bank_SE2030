import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'en' | 'si' | 'ta';
const words: Record<string, [string, string]> = {
  'Products':['නිෂ්පාදන','தயாரிப்புகள்'], 'Services':['සේවා','சேவைகள்'], 'FAQs':['නිතර අසන ප්‍රශ්න','அடிக்கடி கேட்கப்படும் கேள்விகள்'],
  'Log in':['පිවිසෙන්න','உள்நுழைக'], 'Sign in':['පිවිසෙන්න','உள்நுழைக'], 'Sign out':['ඉවත් වන්න','வெளியேறு'],
  'Get started':['ආරම්භ කරන්න','தொடங்குங்கள்'], 'Explore our products':['අපගේ නිෂ්පාදන බලන්න','எங்கள் தயாரிப்புகளைப் பாருங்கள்'],
  'Your everyday.':['ඔබේ එදිනෙදා ජීවිතය.','உங்கள் அன்றாடம்.'], 'Your ambitions.':['ඔබේ බලාපොරොත්තු.','உங்கள் இலட்சியங்கள்.'], 'Your bank.':['ඔබේ බැංකුව.','உங்கள் வங்கி.'],
  'Banking, with you in mind.':['ඔබ වෙනුවෙන් බැංකු සේවා.','உங்களுக்கான வங்கிச் சேவை.'],
  'A simpler way to manage today and plan for tomorrow.':['අද දවස කළමනාකරණයටත් හෙට දවස සැලසුම් කිරීමටත් සරල මගක්.','இன்றை நிர்வகிக்கவும் நாளையைத் திட்டமிடவும் எளிய வழி.'],
  'A place for every possibility.':['සෑම බලාපොරොත්තුවකටම ඉඩක්.','ஒவ்வொரு வாய்ப்புக்கும் ஓர் இடம்.'],
  'Choose a product to discover how it works.':['ක්‍රියා කරන ආකාරය දැන ගැනීමට නිෂ්පාදනයක් තෝරන්න.','செயல்படும் விதத்தை அறிய ஒரு தயாரிப்பைத் தேர்ந்தெடுக்கவும்.'],
  'Accounts':['ගිණුම්','கணக்குகள்'], 'Fixed deposits':['ස්ථාවර තැන්පතු','நிலையான வைப்புகள்'], 'Loans':['ණය','கடன்கள்'], 'Cards':['කාඩ්පත්','அட்டைகள்'],
  'Money transfers':['මුදල් හුවමාරු','பணப் பரிமாற்றங்கள்'], 'Transfers':['හුවමාරු','பரிமாற்றங்கள்'], 'Bill payments':['බිල්පත් ගෙවීම්','கட்டணச் செலுத்தல்கள்'],
  'Transaction history':['ගනුදෙනු ඉතිහාසය','பரிவர்த்தனை வரலாறு'], 'Transactions':['ගනුදෙනු','பரிவர்த்தனைகள்'], 'Help & feedback':['උදව් සහ ප්‍රතිචාර','உதவி மற்றும் கருத்துகள்'],
  'View details':['විස්තර බලන්න','விவரங்களைக் காண்க'], 'Close':['වසන්න','மூடு'], 'Continue to sign in':['පිවිසීමට ඉදිරියට යන්න','உள்நுழைய தொடரவும்'],
  'Everyday balances, all in one place.':['එදිනෙදා ශේෂ එකම තැනක.','அன்றாட இருப்புகள் ஒரே இடத்தில்.'],
  'View your accounts, available balances and account details. Accounts are provisioned separately for this academic simulation.':['ඔබේ ගිණුම්, පවතින ශේෂ සහ ගිණුම් විස්තර බලන්න. මෙම අධ්‍යයන ආදර්ශනය සඳහා ගිණුම් වෙනම සකස් කෙරේ.','உங்கள் கணக்குகள், இருப்புகள் மற்றும் கணக்கு விவரங்களைப் பாருங்கள். இந்தக் கல்வி மாதிரிக்காக கணக்குகள் தனியாக உருவாக்கப்படுகின்றன.'],
  'Make room for your future goals.':['අනාගත ඉලක්ක සඳහා ඉඩ සලසන්න.','எதிர்கால இலக்குகளுக்கு இடமளியுங்கள்.'],
  'Choose an available term, preview simulated interest, confirm with an OTP and track your deposit to maturity. View the configured rates after signing in.':['පවතින කාලසීමාවක් තෝරා, ආදර්ශ පොලිය බලන්න. OTP මගින් තහවුරු කර කල්පිරීම දක්වා තැන්පතුව නිරීක්ෂණය කරන්න. පිවිසීමෙන් පසු පොලී අනුපාත බලන්න.','காலவரையறையைத் தேர்ந்து மாதிரி வட்டியைப் பாருங்கள். OTP மூலம் உறுதிப்படுத்தி முதிர்வு வரை வைப்பைக் கண்காணிக்கவும். உள்நுழைந்தபின் வட்டி விகிதங்களைக் காணலாம்.'],
  'Support for your next chapter.':['ඔබේ ඊළඟ පියවරට සහාය.','உங்கள் அடுத்த கட்டத்திற்கான ஆதரவு.'],
  'Apply for personal, education or home loans. Staff review your information before a manager makes a final decision. Approval is simulated and does not disburse funds.':['පුද්ගලික, අධ්‍යාපන හෝ නිවාස ණය සඳහා අයදුම් කරන්න. කළමනාකරුගේ අවසන් තීරණයට පෙර කාර්ය මණ්ඩලය තොරතුරු සමාලෝචනය කරයි. අනුමැතිය ආදර්ශනයක් වන අතර මුදල් නිකුත් නොකෙරේ.','தனிநபர், கல்வி அல்லது வீட்டுக் கடனுக்கு விண்ணப்பிக்கவும். மேலாளரின் இறுதி முடிவுக்கு முன் ஊழியர்கள் தகவல்களை மதிப்பாய்வு செய்வார்கள். இது மாதிரி ஒப்புதல்; நிதி வழங்கப்படாது.'],
  'Control at your fingertips.':['පාලනය ඔබේ අතේ.','கட்டுப்பாடு உங்கள் விரல்நுனியில்.'],
  'Request a simulated card for an eligible account. Once issued, activate it or block and unblock eligible cards from your dashboard. These are demonstration cards.':['සුදුසු ගිණුමක් සඳහා ආදර්ශ කාඩ්පතක් ඉල්ලන්න. නිකුත් කළ පසු සක්‍රිය කිරීම හෝ අවහිර කිරීම ඔබේ පුවරුවෙන් කළ හැක. මේවා ආදර්ශ කාඩ්පත් වේ.','தகுதியான கணக்கிற்கு மாதிரி அட்டையைக் கோருங்கள். வழங்கப்பட்டபின் உங்கள் முகப்பிலிருந்து செயல்படுத்தவும் முடக்கவும் மீண்டும் இயக்கவும் முடியும். இவை மாதிரி அட்டைகள்.'],
  'Send money with OTP confirmation.':['OTP තහවුරු කිරීම සමඟ මුදල් යවන්න.','OTP உறுதிப்படுத்தலுடன் பணம் அனுப்புங்கள்.'],
  'Save a beneficiary, choose your source account and confirm transfers between supported accounts using an OTP. Track the outcome in transaction history.':['ප්‍රතිලාභියෙකු සුරකින්න, මූලාශ්‍ර ගිණුම තෝරා OTP භාවිතයෙන් හුවමාරුව තහවුරු කරන්න. ප්‍රතිඵලය ගනුදෙනු ඉතිහාසයෙන් බලන්න.','பயனாளியைச் சேமித்து மூலக் கணக்கைத் தேர்ந்து OTP மூலம் பரிமாற்றத்தை உறுதிப்படுத்தவும். முடிவை பரிவர்த்தனை வரலாற்றில் காணலாம்.'],
  'Take care of the everyday.':['එදිනෙදා අවශ්‍යතා සපුරා ගන්න.','அன்றாடத் தேவைகளை நிறைவேற்றுங்கள்.'],
  'Pay supported billers from your account, confirm the payment and keep a record of the transaction in one place. All payments are simulated.':['සහාය දක්වන බිල්පත් ඔබේ ගිණුමෙන් ගෙවා තහවුරු කර වාර්තා එක තැනක තබා ගන්න. සියලු ගෙවීම් ආදර්ශන වේ.','ஆதரிக்கப்படும் கட்டணங்களை உங்கள் கணக்கிலிருந்து செலுத்தி உறுதிப்படுத்தி பதிவுகளை ஒரே இடத்தில் வைத்திருங்கள். அனைத்தும் மாதிரிக் கட்டணங்கள்.'],
  'A clearer view of your activity.':['ඔබේ ක්‍රියාකාරකම් පැහැදිලිව බලන්න.','உங்கள் செயல்பாடுகளின் தெளிவான பார்வை.'],
  'Search and filter past transactions, inspect their status and open individual records for payment details.':['පැරණි ගනුදෙනු සොයා පෙරා, තත්ත්වය සහ ගෙවීම් විස්තර බලන්න.','முந்தைய பரிவர்த்தனைகளைத் தேடி வடிகட்டி அவற்றின் நிலை மற்றும் கட்டண விவரங்களைப் பாருங்கள்.'],
  'We are here to listen.':['ඔබට සවන් දීමට අපි සූදානම්.','உங்கள் கருத்துகளைக் கேட்கத் தயாராக உள்ளோம்.'],
  'Send a private service request, share feedback or read published customer reviews. Staff can review and respond to your requests.':['පෞද්ගලික සේවා ඉල්ලීමක් යවන්න, ප්‍රතිචාර බෙදා ගන්න හෝ පාරිභෝගික අදහස් කියවන්න. කාර්ය මණ්ඩලයට ඉල්ලීම් සමාලෝචනය කර පිළිතුරු දිය හැක.','தனிப்பட்ட சேவைக் கோரிக்கையை அனுப்பவும், கருத்தைப் பகிரவும் அல்லது வாடிக்கையாளர் மதிப்புரைகளைப் படிக்கவும். ஊழியர்கள் கோரிக்கைகளைப் பரிசீலித்துப் பதிலளிக்கலாம்.'],
  'Exchange rates':['විනිමය අනුපාත','நாணய மாற்று விகிதங்கள்'], 'Indicative rates · 1 foreign currency unit in LKR':['ආසන්න අනුපාත · විදේශ මුදල් ඒකක 1ක් සඳහා LKR','குறிப்பு விகிதங்கள் · 1 வெளிநாட்டு நாணய அலகு LKR இல்'],
  'Updated':['යාවත්කාලීන කළේ','புதுப்பிக்கப்பட்டது'], 'Previously available rates. Refresh pending.':['පෙර ලබාගත් අනුපාත. යාවත්කාලීන කිරීම අපේක්ෂිතයි.','முன்பு கிடைத்த விகிதங்கள். புதுப்பிப்பு நிலுவையில் உள்ளது.'],
  'Rates are unavailable. Please try again.':['අනුපාත ලබාගත නොහැක. නැවත උත්සාහ කරන්න.','விகிதங்கள் கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.'], 'Retry':['නැවත උත්සාහ කරන්න','மீண்டும் முயற்சிக்கவும்'],
  'Overview':['දළ විශ්ලේෂණය','கண்ணோட்டம்'], 'Customer dashboard':['පාරිභෝගික පුවරුව','வாடிக்கையாளர் முகப்பு'], 'Bank staff dashboard':['බැංකු කාර්ය මණ්ඩල පුවරුව','வங்கி ஊழியர் முகப்பு'], 'Branch manager dashboard':['ශාඛා කළමනාකරු පුවරුව','கிளை மேலாளர் முகப்பு'], 'System administrator dashboard':['පද්ධති පරිපාලක පුවරුව','கணினி நிர்வாகி முகப்பு'],
  'Customers':['පාරිභෝගිකයන්','வாடிக்கையாளர்கள்'], 'Loan review':['ණය සමාලෝචනය','கடன் மதிப்பாய்வு'], 'Loan decisions':['ණය තීරණ','கடன் முடிவுகள்'], 'Card requests':['කාඩ්පත් ඉල්ලීම්','அட்டை கோரிக்கைகள்'], 'Feedback moderation':['ප්‍රතිචාර සමාලෝචනය','கருத்து மதிப்பாய்வு'], 'User management':['පරිශීලක කළමනාකරණය','பயனர் மேலாண்மை'], 'Audit trail':['විගණන සටහන්','தணிக்கைப் பதிவுகள்'],
  'Notifications':['දැනුම්දීම්','அறிவிப்புகள்'], 'Customer reviews':['පාරිභෝගික අදහස්','வாடிக்கையாளர் மதிப்புரைகள்'], 'My profile':['මගේ පැතිකඩ','எனது சுயவிவரம்'], 'Beneficiaries':['ප්‍රතිලාභීන්','பயனாளிகள்'], 'Feedback':['ප්‍රතිචාර','கருத்துகள்'],
  'Username':['පරිශීලක නාමය','பயனர்பெயர்'], 'Password':['මුරපදය','கடவுச்சொல்'], 'Email':['විද්‍යුත් තැපෑල','மின்னஞ்சல்'], 'Welcome back':['නැවත සාදරයෙන් පිළිගනිමු','மீண்டும் வருக'], 'Start your journey':['ඔබේ ගමන අරඹන්න','உங்கள் பயணத்தைத் தொடங்குங்கள்'], 'Register':['ලියාපදිංචි වන්න','பதிவு செய்க'],
  'One secure login for customers, bank staff, branch managers and system administrators. Your account determines your workspace.':['පාරිභෝගිකයන්, කාර්ය මණ්ඩලය, කළමනාකරුවන් සහ පරිපාලකයන් සඳහා එකම පිවිසුමක්. ඔබේ ගිණුම අනුව කාර්ය පුවරුව විවෘත වේ.','வாடிக்கையாளர்கள், ஊழியர்கள், மேலாளர்கள் மற்றும் நிர்வாகிகளுக்கு ஒரே பாதுகாப்பான உள்நுழைவு. உங்கள் கணக்கு உங்கள் பணித்தளத்தைத் தீர்மானிக்கும்.'],
  'Academic simulation · No real financial services':['අධ්‍යයන ආදර්ශනයකි · සැබෑ මූල්‍ය සේවා නොමැත','கல்வி மாதிரி · உண்மையான நிதிச் சேவைகள் இல்லை'],
  'Do I need to log in to explore?':['ගවේෂණය කිරීමට පිවිසිය යුතුද?','பார்வையிட உள்நுழைய வேண்டுமா?'], 'Browse products and rates freely. Sign in to access your workspace.':['නිෂ්පාදන සහ අනුපාත නිදහසේ බලන්න. ඔබේ පුවරුවට පිවිසීමට ලොග් වන්න.','தயாரிப்புகள் மற்றும் விகிதங்களை இலவசமாகப் பாருங்கள். பணித்தளத்தை அணுக உள்நுழையவும்.'],
  'How do I get started?':['ආරම්භ කරන්නේ කෙසේද?','எப்படி தொடங்குவது?'], 'Create a customer profile. Staff accounts are created by the system administrator.':['පාරිභෝගික පැතිකඩක් සාදන්න. කාර්ය මණ්ඩල ගිණුම් පද්ධති පරිපාලක විසින් සාදනු ලැබේ.','வாடிக்கையாளர் சுயவிவரத்தை உருவாக்கவும். ஊழியர் கணக்குகளை நிர்வாகி உருவாக்குவார்.'],
  'Previous':['පෙර','முந்தைய'], 'Next':['ඊළඟ','அடுத்து'], 'Status':['තත්ත්වය','நிலை'], 'Amount':['මුදල','தொகை'], 'Date':['දිනය','தேதி'], 'Type':['වර්ගය','வகை'], 'Open':['විවෘත කරන්න','திறக்கவும்'], 'Save':['සුරකින්න','சேமிக்கவும்'], 'Cancel':['අවලංගු කරන්න','ரத்து செய்க'],
  'Your accounts':['ඔබේ ගිණුම්','உங்கள் கணக்குகள்'], 'Recent activity':['මෑත ක්‍රියාකාරකම්','சமீபத்திய செயல்பாடு'], 'Send money':['මුදල් යවන්න','பணம் அனுப்புங்கள்'], 'Pay a bill':['බිල්පතක් ගෙවන්න','கட்டணம் செலுத்துங்கள்'], 'Your people':['ඔබේ ප්‍රතිලාභීන්','உங்கள் பயனாளிகள்'],
};
Object.assign(words, {
  'Manage daily service requests and review applications.':['දෛනික සේවා ඉල්ලීම් සහ අයදුම්පත් සමාලෝචනය කරන්න.','அன்றாட சேவைக் கோரிக்கைகளையும் விண்ணப்பங்களையும் நிர்வகிக்கவும்.'],
  'Oversee staff operations and make final loan decisions.':['කාර්ය මණ්ඩල මෙහෙයුම් අධීක්ෂණය කර අවසන් ණය තීරණ ගන්න.','ஊழியர் செயல்பாடுகளைக் கண்காணித்து இறுதிக் கடன் முடிவுகளை எடுக்கவும்.'],
  'Oversee bank operations, user access and the audit trail.':['බැංකු මෙහෙයුම්, පරිශීලක ප්‍රවේශය සහ විගණන සටහන් අධීක්ෂණය කරන්න.','வங்கி செயல்பாடுகள், பயனர் அணுகல் மற்றும் தணிக்கைப் பதிவுகளைக் கண்காணிக்கவும்.'],
  'Everyday service starts here.':['දෛනික සේවාව මෙතැනින් ඇරඹේ.','அன்றாட சேவை இங்கே தொடங்குகிறது.'],
  'A wider view. A clear decision.':['පුළුල් දැක්මක්. පැහැදිලි තීරණයක්.','பரந்த பார்வை. தெளிவான முடிவு.'],
  'Your bank, in full view.':['ඔබේ බැංකුවේ සම්පූර්ණ දැක්ම.','உங்கள் வங்கியின் முழுமையான பார்வை.'],
  'Open an operation below to view live records and take action.':['සජීවී වාර්තා බැලීමට සහ ක්‍රියා කිරීමට පහත මෙහෙයුමක් විවෘත කරන්න.','நேரடி பதிவுகளைப் பார்த்துச் செயல்பட கீழே ஒரு செயல்பாட்டைத் திறக்கவும்.'],
  'View customer profiles':['පාරිභෝගික පැතිකඩ බලන්න','வாடிக்கையாளர் சுயவிவரங்களைக் காண்க'],
  'Review and recommend applications':['අයදුම්පත් සමාලෝචනය කර නිර්දේශ කරන්න','விண்ணப்பங்களை மதிப்பாய்வு செய்து பரிந்துரைக்கவும்'],
  'Issue simulated cards':['ආදර්ශ කාඩ්පත් නිකුත් කරන්න','மாதிரி அட்டைகளை வழங்கவும்'],
  'Respond to requests and moderate reviews':['ඉල්ලීම්වලට පිළිතුරු දී අදහස් සමාලෝචනය කරන්න','கோரிக்கைகளுக்குப் பதிலளித்து மதிப்புரைகளை நிர்வகிக்கவும்'],
  'Make final decisions on recommended loans':['නිර්දේශිත ණය පිළිබඳ අවසන් තීරණ ගන්න','பரிந்துரைக்கப்பட்ட கடன்களில் இறுதி முடிவுகளை எடுக்கவும்'],
  'Create staff accounts and manage access':['කාර්ය මණ්ඩල ගිණුම් සාදා ප්‍රවේශය කළමනාකරණය කරන්න','ஊழியர் கணக்குகளை உருவாக்கி அணுகலை நிர்வகிக்கவும்'],
  'Inspect recorded banking events':['බැංකු සිදුවීම් සටහන් පරීක්ෂා කරන්න','பதிவான வங்கி நிகழ்வுகளைப் பரிசோதிக்கவும்'],
  'Loan reviewers cannot make the final decision on their own recommendations.':['ණය සමාලෝචකයන්ට තමන්ගේම නිර්දේශ සඳහා අවසන් තීරණය ගත නොහැක.','கடன் மதிப்பாய்வாளர்கள் தங்கள் சொந்தப் பரிந்துரைகளில் இறுதி முடிவெடுக்க முடியாது.'],
  'Unable to load':['පූරණය කළ නොහැක','ஏற்ற முடியவில்லை'], 'Create customer profile':['පාරිභෝගික පැතිකඩ සාදන්න','வாடிக்கையாளர் சுயவிவரம் உருவாக்குக'],
  'Please wait…':['කරුණාකර රැඳී සිටින්න…','தயவுசெய்து காத்திருக்கவும்…'], 'Sign in':['පිවිසෙන්න','உள்நுழைக'],
  'Already a customer?':['දැනටමත් පාරිභෝගිකයෙක්ද?','ஏற்கனவே வாடிக்கையாளரா?'], 'New to Serendib?':['සෙරන්ඩිබ් වෙත අලුත්ද?','செரண்டிப்பிற்கு புதியவரா?'],
  'Create your customer profile.':['ඔබේ පාරිභෝගික පැතිකඩ සාදන්න.','உங்கள் வாடிக்கையாளர் சுயவிவரத்தை உருவாக்கவும்.'],
  'A clear view of what matters today.':['අද වැදගත් දේ පිළිබඳ පැහැදිලි දැක්මක්.','இன்று முக்கியமானவற்றின் தெளிவான பார்வை.'],
  'Make room for tomorrow.':['හෙට දවසට ඉඩ සලසන්න.','நாளைக்கு இடமளியுங்கள்.'],
  'Explore fixed deposits with clear terms and simulated returns.':['පැහැදිලි කොන්දේසි සහ ආදර්ශ ප්‍රතිලාභ සහිත ස්ථාවර තැන්පතු බලන්න.','தெளிவான விதிமுறைகள் மற்றும் மாதிரி வருமானங்களுடன் நிலையான வைப்புகளை ஆராயுங்கள்.'],
  'Explore fixed deposits':['ස්ථාවර තැන්පතු බලන්න','நிலையான வைப்புகளைப் பாருங்கள்'], 'View all':['සියල්ල බලන්න','அனைத்தையும் காண்க'],
  'Transfer to a saved beneficiary':['සුරැකි ප්‍රතිලාභියෙකුට මුදල් යවන්න','சேமித்த பயனாளிக்கு பணம் அனுப்பவும்'],
  'Take care of the everyday':['එදිනෙදා අවශ්‍යතා සපුරා ගන්න','அன்றாடத் தேவைகளை நிறைவேற்றுங்கள்'],
  'Manage saved recipients':['සුරැකි ලබන්නන් කළමනාකරණය කරන්න','சேமித்த பெறுநர்களை நிர்வகிக்கவும்'],
  'Loading your banking information…':['බැංකු තොරතුරු පූරණය වෙමින් පවතී…','வங்கித் தகவல்கள் ஏற்றப்படுகின்றன…'],
  'ACTIVE':['සක්‍රිය','செயலில்'], 'PENDING':['අපේක්ෂිත','நிலுவை'], 'APPROVED':['අනුමතයි','அங்கீகரிக்கப்பட்டது'], 'REJECTED':['ප්‍රතික්ෂේපිතයි','நிராகரிக்கப்பட்டது'], 'COMPLETED':['සම්පූර්ණයි','முடிந்தது'],
  'Transaction':['ගනුදෙනුව','பரிவர்த்தனை'], 'Customer':['පාරිභෝගිකයා','வாடிக்கையாளர்'], 'User':['පරිශීලකයා','பயனர்'], 'Role':['භූමිකාව','பங்கு'], 'Access':['ප්‍රවේශය','அணுகல்'],
  'Phone':['දුරකථනය','தொலைபேசி'], 'Address':['ලිපිනය','முகவரி'], 'Date of birth':['උපන් දිනය','பிறந்த தேதி'], 'Department':['අංශය','துறை'], 'Position':['තනතුර','பதவி'],
  'Initial password':['ආරම්භක මුරපදය','ஆரம்பக் கடவுச்சொல்'], 'Create staff user':['කාර්ය මණ්ඩල පරිශීලකයෙකු සාදන්න','ஊழியர் பயனரை உருவாக்கவும்'], 'View profile':['පැතිකඩ බලන්න','சுயவிவரத்தைக் காண்க'],
});
const Context=createContext({language:'en' as Language,setLanguage:(_value:Language)=>{},t:(text:string)=>text});
export function LanguageProvider({children}:{children:ReactNode}) {
  const [language,setLanguage]=useState<Language>(()=>{try {const value=localStorage.getItem('serendib-language');return value==='si'||value==='ta'?value:'en';}catch{return 'en';}});
  useEffect(()=>{document.documentElement.lang=language;try{localStorage.setItem('serendib-language',language);}catch{/* Storage may be unavailable. */}},[language]);
  const t=(text:string)=>language==='en'?text:words[text]?.[language==='si'?0:1]||text;
  return <Context.Provider value={{language,setLanguage,t}}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
export function Text({value}:{value:string}) {const {t}=useLanguage();return <>{t(value)}</>;}
export function LanguageButtons(){const {language,setLanguage}=useLanguage();return <div className="language-buttons" role="group" aria-label="Language / භාෂාව / மொழி">{([['en','English'],['si','සිංහල'],['ta','தமிழ்']] as const).map(([code,label])=><button type="button" key={code} lang={code} aria-pressed={language===code} onClick={()=>setLanguage(code)}>{label}</button>)}</div>;}
