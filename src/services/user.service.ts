import { service } from "../lib/services/service.js";
import Fuse from "fuse.js";
import prisma from "../client.js";
import * as R from "remeda";
import exclude from "../utils/exclude.js";
import bcrypt from "bcryptjs";
import { encryptPassword } from "../utils/encryption.js";
import { Role } from '@prisma/client';

const customServices = {
  searchUser: async (keyword: string) => {    
    const isRole = Object.values(Role).includes(keyword as Role);
    // Step 1: Fetch all active users from the database
    const user = await prisma.user.findMany({
      where: {
        is_active: true,
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { mobile_number: { contains: keyword, mode: "insensitive" } },
          { email_address: { contains: keyword, mode: "insensitive" } },
          { designation: { contains: keyword, mode: "insensitive" } },
          { target_freq_per_month: { contains: keyword, mode: "insensitive" } },
          { user_id: { contains: keyword, mode: "insensitive" } },
          ...(isRole
            ? [
                {
                  roles: {
                    equals: keyword as Role,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        name: true,
        mobile_number: true,
        designation: true,
        email_address: true,
        target_freq_per_month: true,
        user_id: true,
        roles: true,
        createdAt: true,
      },
    });
  
    // Step 2: Initialize Fuse.js with enhanced fuzzy search configuration
    const fuse = new Fuse(user, {
      keys: ["name", "mobile_number", "email_address", "designation", "user_id", "roles"],
      threshold: 0.5, // Adjust threshold for fuzzy matching
      includeMatches: true,
      includeScore: true,
      useExtendedSearch: true,
    });
  
    // Step 3: Perform a fuzzy search on the user data
    const userSearch = fuse.search(keyword);
  
    // Step 4: Return matching results or an empty array
    if (userSearch.length > 0) {
      return userSearch.map((result) => result.item); // Return all matching items
    }
  
    return [];
  },
  createV2: async (data: any) => {
   


  
    const userData = { ...data, password: await encryptPassword("user@123") };
    console.log(userData);
    
      
    let item = await prisma.user.create({
      data: userData,
    });
  console.log(item);
  
    // Exclude password from the returned user object
    const safeItem = exclude(item, ["password"]);
  
    return safeItem;
  },
};
const CRUDServices = service<"user">("user");

export const userService = { ...customServices, ...CRUDServices };
