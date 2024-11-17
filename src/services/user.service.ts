import { service } from "../lib/services/service.js";
import Fuse from "fuse.js";
import prisma from "../client.js";
import * as R from "remeda";

const customServices = {
  searchUser: async (keyword: string) => {
    const user = await prisma.user.findMany({
      where: {
        is_active: true,
      },
      select: {
        name: true,
        mobile_number: true,
        designation: true,
        email_address: true,
        target_freq_per_month: true,
        user_id: true,
      },
    });
    const fuse = new Fuse(user, {
      keys: ["name", "designation", "email_address"],
      threshold: 0.5,
      location: 0,
      distance: 100,
      includeMatches: true,
      includeScore: true,
      useExtendedSearch: true,
    });
    const userSearch = fuse.search(keyword);
    if (R.hasAtLeast(userSearch, 1)) {
      return userSearch.at(0)?.item;
    }
    return [];
  },
};
const CRUDServices = service<"user">("user");

export const userService = { ...customServices, ...CRUDServices };