/* eslint-disable @typescript-eslint/no-explicit-any */
import * as crypto from 'crypto';
// Function to parse and format biblical markup - removes Strong's numbers for clean reading
export const parseScriptureMarkup = (text: string) => {
  if (!text) return text;

  const parsedText = text
    // Remove malformed Strong's numbers (H1234>, G5678>)
    .replace(/([HG]\d+)>/g, "")
    // Remove standard Strong's numbers (H1234, G5678)
    .replace(/([HG]\d+)/g, "")
    // Words of Christ in red letters (some traditions)
    .replace(/\[([^\]]+)\]/g, '<span class="words-of-christ">$1</span>')
    // Italicized words (added for clarity, not in original)
    .replace(/\*([^*]+)\*/g, '<em class="added-words">$1</em>')
    // Footnote markers (superscript numbers/letters)
    .replace(/\^(\w+)/g, '<sup class="footnote-marker">$1</sup>')
    // Poetry/verse indentation markers
    .replace(/^\s{2,}/gm, '<span class="verse-indent">&nbsp;&nbsp;</span>')
    // Clean up any remaining malformed markup
    .replace(/<(?!\/?(span|em|sup|strong|b|i|u)\b)[^>]*>/g, "")
    // Clean up extra spaces that might be left after removing codes
    .replace(/\s+/g, " ")
    .trim();

  return parsedText;
};
export type Segment = {
  text: string;
  class: string;
};

export const generateSegments = (message: string): Segment[] => {
  const sentences = message.split(/[.!?]+/).filter((s) => s.trim());
  const segments: Segment[] = [];

  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    let segmentClass = "segment-2";
    const effects: string[] = [];

    if (index === 0) {
      segmentClass = "segment-1";
      effects.push("neon-text");
    } else if (index === sentences.length - 1) {
      segmentClass = "segment-5";
      effects.push("glow-text");
    } else if (index % 3 === 0) {
      segmentClass = "segment-3";
    } else if (index % 2 === 0) {
      segmentClass = "segment-4";
    }

    const lowerText = trimmed.toLowerCase();
    if (lowerText.includes("welcome") || lowerText.includes("glad")) {
      effects.push("rainbow-text");
    }
    if (lowerText.includes("love") || lowerText.includes("heart")) {
      effects.push("pulse-text");
    }
    if (
      lowerText.includes("god") ||
      lowerText.includes("worship") ||
      lowerText.includes("holy spirit")
    ) {
      effects.push("fire-text", "shake-text");
    }
    if (
      lowerText.includes("family") ||
      lowerText.includes("home") ||
      lowerText.includes("belong")
    ) {
      effects.push("glow-text");
    }
    if (
      lowerText.includes("joy") ||
      lowerText.includes("peace") ||
      lowerText.includes("blessed")
    ) {
      effects.push("sparkle-text");
    }
    if (lowerText.includes("special") || lowerText.includes("today")) {
      effects.push("electric-text");
    }
    if (
      lowerText.includes("prayer") ||
      lowerText.includes("hope") ||
      lowerText.includes("faith")
    ) {
      effects.push("crystalline-text");
    }

    let processedText = trimmed;
    const keyWords = [
      "welcome",
      "love",
      "God",
      "worship",
      "family",
      "home",
      "joy",
      "peace",
      "blessed",
      "hope",
      "faith",
      "prayer",
    ];
    keyWords.forEach((word) => {
      const regex = new RegExp(`\\b(${word})\\b`, "gi");
      processedText = processedText.replace(
        regex,
        '<span class="bold-text">$1</span>'
      );
    });

    const emphasisWords = [
      "special",
      "excited",
      "honored",
      "thrilled",
      "overjoyed",
    ];
    emphasisWords.forEach((word) => {
      const regex = new RegExp(`\\b(${word})\\b`, "gi");
      processedText = processedText.replace(
        regex,
        '<span class="underlined-text">$1</span>'
      );
    });

    if (effects.length > 0) {
      processedText = `<span class="${effects.join(
        " "
      )}">${processedText}</span>`;
    }

    segments.push({
      text: processedText,
      class: segmentClass,
    });
  });

  return segments;
};

export const getExcerpt = (str: string, maxLength: number) => {
    if (str.length <= maxLength) {
        return str;
    }

    const excerpt = str.slice(0, maxLength);
    const lastSpace = excerpt.lastIndexOf(' ');
    if (lastSpace === -1) {
        return excerpt + '...';
    }
    return excerpt.slice(0, lastSpace) + '...';
}


export const validateKenyaNumbers = (num: string | number) => {
    const number = num.toString();

    // Safaricom (\\+?254|0)?([7][0129][0-9]|[7][4][0123568]|[7][5][789]|[7][6][89]|[1][1][012345]){1}[0-9]{6}
    // Airtel (\\+?254|0)?([7][38][0-9]|[7][5][0123456]|[7][6][2]|[1][0][012345678]){1}[0-9]{6}
    // Telkom (\\+?254|0)?(77[0-9]){1}[0-9]{6}
    // Faiba (\\+?254|0)?(747){1}[0-9]{6}
    // Equitel (\\+?254|0)?(76[3456]){1}[0-9]{6}

    const safaricomValidator = /^(?:254|\+254|0)?((?:(?:7(?:(?:[01249][0-9])|(?:5[789])|(?:6[89])))|(?:1(?:[1][0-5])))[0-9]{6})$/;
    return safaricomValidator.test(number);
}

export function timeAgo(
  date: Date | string | number, 
  options: { 
    daysCutoff?: number; 
    dateFormat?: Intl.DateTimeFormatOptions 
  } = {}
): string {
  const { daysCutoff = 2, dateFormat = {} } = options;
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return 'in the future';
  }

  const intervals = [
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      // If it's more than the cutoff days, show the date in yyyy-mm-dd format
      if (interval.label === 'day' && count > daysCutoff) {
        if (Object.keys(dateFormat).length === 0) {
          // Default to yyyy-mm-dd format
          return past.toISOString().split('T')[0];
        }
        return past.toLocaleDateString(undefined, dateFormat);
      }
      
      return count === 1 
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return 'just now';
}

export const getFormattedTimestamp = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export const getRandomDate = (startDate: Date, endDate: Date): Date => {
    const startTime: number = startDate.getTime();
    const endTime: number = endDate.getTime();
    const randomTime: number = Math.random() * (endTime - startTime) + startTime;
    const randomDate = new Date(randomTime);
    return randomDate
    // if(isValidDate(randomDate)) {
    // }
    // return getRandomDate(startDate, endDate);
}

export const addDateDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export const isDateLessThanToday = (date: Date): boolean => {
    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);
    const comparisonDate: Date = new Date(date);
    comparisonDate.setHours(0, 0, 0, 0);
    return comparisonDate <= today;
}

export const rand = (count: number) =>
    crypto.randomBytes(count).toString('hex');

type Flatten<T> = T extends Array<infer U> ? U : T;
export const recursiveFlatten = <T>(array: T[]): Array<Flatten<T>> => {
    return array.reduce<Array<Flatten<T>>>((acc, value) => {
        if (Array.isArray(value)) {
            acc.push(...recursiveFlatten(value));
        } else {
            acc.push(value as Flatten<T>);
        }

        return acc;
    }, []);
};

export const numericHash = (count: number) =>
    Math.random()
        .toString()
        .slice(2, 2 + count);

export const hash = (str: string) =>
    crypto.createHash('sha1').update(str).digest('hex');

export const sleep = async (ms: number): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

export const randomColor = () =>
    `rgb(${[1, 2, 3].map(() => Math.random() * 256 || 0).toString()})`;

export const mustache = (str: string, data = {}) =>
    Object.entries(data).reduce(
        (res, [key, value]) =>
            res.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value as string),
        str
    );

export const ucwords = function (value: string) {
    const str = value.toLowerCase();
    return str.replace(/\b\w/g, (c) => c?.toUpperCase());
};

export function indexBy<A, K>(list: A[], keyGetter: (a: A) => K): Map<K, A> {
    const map = new Map<K, A>();
    list.forEach(item => {
        const key = keyGetter(item);
        if (key ?? !map.has(key)) {
            map.set(key, item);
        }
    });
    return map;
}

export const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().valueOf() - date.valueOf()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval).toString() + ' years';
    }

    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval).toString() + ' months';
    }

    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval).toString() + ' days';
    }

    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval).toString() + ' hrs';
    }

    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval).toString() + ' mins';
    }

    return Math.floor(seconds).toString() + ' s';
};

export const isset = (...variables: any) => {
    for (const variable of variables) {
        if (variable === null || variable === undefined) {
            return false;
        }
    }

    return true;
};

export const emailHtmlDefault = (
    url: string,
    site: string,
    email: string,
    token: string
) => {

    // Some simple styling options
    const backgroundColor = '#edf0f3';
    const mainBackgroundColor = '#ffffff';
    const headerBackgroundColor = '#F6F8FA';

    const date = new Date();
    const year = date.getFullYear();
    const longdate = date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Uses tables for layout and inline CSS due to email client limitations
    return `
  <body style="background: ${backgroundColor};padding: 50px 0;">
  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="${backgroundColor}" style="background-color: ${backgroundColor};table-layout:fixed;">
      <tbody>
          <tr>
              <td align="center">
                  <center style="width:100%">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="512" bgcolor="${mainBackgroundColor}" style="background-color: ${mainBackgroundColor}; margin:0 auto;max-width:512px;width:inherit">
                          <tbody>
                              <tr>
                                  <td bgcolor="${headerBackgroundColor}" style="background-color:#${headerBackgroundColor};padding:12px;border-bottom:1px solid #ececec; margin-top:30px;">
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%!important;min-width:100%!important">
                                          <tbody>
                                              <tr>
                                                  <td align="left" valign="middle"><a href="" style="color:#0073b1;display:inline-block;text-decoration:none" target="_blank"> <img alt="IPC Analysis Platform" border="0" src="https://ap.ipcinfo.org/img/compact_logo_E_white.png" height="34" width="40" style="outline:none;color:#ffffff;text-decoration:none"></a></td>
                                                  <td valign="middle" width="100%" align="right">
                                                      <a href="" style="margin:0;color:#0073b1;display:inline-block;text-decoration:none" target="_blank">
                                                          <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                                              <tbody>
                                                                  <tr>
                                                                      <td align="left" valign="middle" style="padding:0 0 0 10px">
                                                                          <p style="margin:0;font-weight:400"> <span style="word-wrap:break-word;color:#4c4c4c;word-break:break-word;font-weight:400;font-size:14px;line-height:1.429">${email}</span></p>
                                                                      </td>
                                                                  </tr>
                                                              </tbody>
                                                          </table>
                                                      </a>
                                                  </td>
                                                  <td width="1">&nbsp;</td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                          <tbody>
                                              <tr>
                                                  <td style="padding:20px 24px 32px 24px">
                                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                                          <tbody>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <h2 style="margin:0;color:#262626;font-weight:700;font-size:16px;line-height:1.2">Hi User,</h2>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <h2 style="margin:0;color:#262626;font-weight:200;font-size:14px;line-height:1.333">Here is your one-time code that will <span>sign</span> you <span>in</span> instantly.</h2>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                <td style="padding:8px 24px;font-weight:500;font-size:44px;">
                                                                    ${token}
                                                                </td>                                                                 
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <p style="margin:0;color:#4c4c4c;font-weight:400;font-size:14px;line-height:1.25">This link is valid for 1hr. Please do not forward this email to others to prevent anybody else from accessing your account.</p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <p style="margin:0;color:#4c4c4c;font-weight:400;font-size:14px;line-height:1.25">If you have any questions or concerns, please feel free to contact our support team. We are here to assist you.</p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <p style="margin:0;color:#4c4c4c;font-weight:400;font-size:14px;line-height:1.25">The IPC Analysis Platform</p>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                          <tbody>
                                              <tr>
                                                  <td bgcolor="#F8FAFC" style="background-color:#f8fafc;padding:16px 24px">
                                                      <p style="margin:0;color:#737373;font-weight:700;font-size:12px;line-height:1.333">Date: ${longdate}</p>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#EDF0F3" align="center" style="background-color:#edf0f3;padding:0 24px;color:#6a6c6d;text-align:center">
                                          <tbody>
                                              <tr>
                                                  <td align="center" style="padding:16px 0 0 0;text-align:center"></td>
                                              </tr>
                                              <tr>
                                                  <td>
                                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                                          <tbody>
                                                              <tr>
                                                                  <td align="center" style="padding:0 0 12px 0;text-align:center">
                                                                      <p style="margin:0;color:#6a6c6d;font-weight:400;font-size:12px;line-height:1.333"></p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td align="center" style="padding:0 0 12px 0;text-align:center">
                                                                      <p style="margin:0;word-wrap:break-word;color:#6a6c6d;word-break:break-word;font-weight:400;font-size:12px;line-height:1.333">This email was intended for ${email}.  Please ignore this email if you did not initiate this login email or if it was not intended for you. We apologize for any inconvenience caused. <a href="${site}/terms-of-use" style="color:#6a6c6d;text-decoration:underline;display:inline-block" target="_blank">Learn why we included this.</a></p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td align="center" style="padding:0 0 12px 0;text-align:center">
                                                                      <p style="margin:0;color:#6a6c6d;font-weight:400;font-size:12px;line-height:1.333">&copy; ${year} <span>IPC Analysis Platform</span>.</p>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </center>
              </td>
          </tr>
      </tbody>
  </table>
</body>
`;
};

export const emailVerificationHtmlDefault = (
    url: string,
    site: string,
    email: string
) => {
    const backgroundColor = '#edf0f3';
    const mainBackgroundColor = '#ffffff';
    const headerBackgroundColor = '#F6F8FA';

    const date = new Date();
    const year = date.getFullYear();
    const longdate = date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Uses tables for layout and inline CSS due to email client limitations
    return `
  <body style="background: ${backgroundColor};padding: 50px 0;">
  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="${backgroundColor}" style="background-color: ${backgroundColor};table-layout:fixed;">
      <tbody>
          <tr>
              <td align="center">
                  <center style="width:100%">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="512" bgcolor="${mainBackgroundColor}" style="background-color: ${mainBackgroundColor}; margin:0 auto;max-width:512px;width:inherit">
                          <tbody>
                              <tr>
                                  <td bgcolor="${headerBackgroundColor}" style="background-color:#${headerBackgroundColor};padding:12px;border-bottom:1px solid #ececec; margin-top:30px;">
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%!important;min-width:100%!important">
                                          <tbody>
                                              <tr>
                                                  <td align="left" valign="middle"><a href="" style="color:#0073b1;display:inline-block;text-decoration:none" target="_blank"> <img alt="IPC Analysis Platform" border="0" src="https://ap.ipcinfo.org/img/compact_logo_E_white.png" height="34" width="40" style="outline:none;color:#ffffff;text-decoration:none"></a></td>
                                                  <td valign="middle" width="100%" align="right">
                                                      <a href="" style="margin:0;color:#0073b1;display:inline-block;text-decoration:none" target="_blank">
                                                          <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                                              <tbody>
                                                                  <tr>
                                                                      <td align="left" valign="middle" style="padding:0 0 0 10px">
                                                                          <p style="margin:0;font-weight:400"> <span style="word-wrap:break-word;color:#4c4c4c;word-break:break-word;font-weight:400;font-size:14px;line-height:1.429">${email}</span></p>
                                                                      </td>
                                                                  </tr>
                                                              </tbody>
                                                          </table>
                                                      </a>
                                                  </td>
                                                  <td width="1">&nbsp;</td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                          <tbody>
                                              <tr>
                                                  <td style="padding:20px 24px 32px 24px">
                                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                                          <tbody>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <h2 style="margin:0;color:#262626;font-weight:700;font-size:16px;line-height:1.2">Hi User,</h2>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <h2 style="margin:0;color:#262626;font-weight:200;font-size:14px;line-height:1.333">Here is your one-time link that will redirect you to user activation page.</h2>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                <td style="padding:8px 24px;color:#6a6c6d;font-weight:500;font-size:14px;">
                                                                    <p style="margin:10;">${url}</p>
                                                                </td>                                                              
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <p style="margin:0;color:#4c4c4c;font-weight:400;font-size:14px;line-height:1.25">This link is valid for 1hr. Please do not forward this email to others to prevent anybody else from accessing your account.</p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <p style="margin:0;color:#4c4c4c;font-weight:400;font-size:14px;line-height:1.25">If you have any questions or concerns, please feel free to contact our support team. We are here to assist you.</p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="padding-bottom:20px">
                                                                      <p style="margin:0;color:#4c4c4c;font-weight:400;font-size:14px;line-height:1.25">The IPC Analysis Platform</p>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                          <tbody>
                                              <tr>
                                                  <td bgcolor="#F8FAFC" style="background-color:#f8fafc;padding:16px 24px">
                                                      <p style="margin:0;color:#737373;font-weight:700;font-size:12px;line-height:1.333">Date: ${longdate}</p>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#EDF0F3" align="center" style="background-color:#edf0f3;padding:0 24px;color:#6a6c6d;text-align:center">
                                          <tbody>
                                              <tr>
                                                  <td align="center" style="padding:16px 0 0 0;text-align:center"></td>
                                              </tr>
                                              <tr>
                                                  <td>
                                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                                          <tbody>
                                                              <tr>
                                                                  <td align="center" style="padding:0 0 12px 0;text-align:center">
                                                                      <p style="margin:0;color:#6a6c6d;font-weight:400;font-size:12px;line-height:1.333"></p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td align="center" style="padding:0 0 12px 0;text-align:center">
                                                                      <p style="margin:0;word-wrap:break-word;color:#6a6c6d;word-break:break-word;font-weight:400;font-size:12px;line-height:1.333">This email was intended for ${email}.  Please ignore this email if you did not initiate this login email or if it was not intended for you. We apologize for any inconvenience caused. <a href="${site}/terms-of-use" style="color:#6a6c6d;text-decoration:underline;display:inline-block" target="_blank">Learn why we included this.</a></p>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td align="center" style="padding:0 0 12px 0;text-align:center">
                                                                      <p style="margin:0;color:#6a6c6d;font-weight:400;font-size:12px;line-height:1.333">&copy; ${year} <span>IPC Analysis Platform</span>.</p>
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </center>
              </td>
          </tr>
      </tbody>
  </table>
</body>
`;
};

export const numberFormat = (number: string | number) => {
    const options = {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }
    return Intl.NumberFormat('en-US', options).format(Number(number));
}


// Email text body – fallback for email clients that don't render HTML
export const emailText = (url: string, site: string) =>
    `Sign in to ${site}\n${url}\n\n`;
